import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import Link from 'next/link';
import UpgradeButton from '@/components/billing/UpgradeButton';
import { getTranslations } from 'next-intl/server';

type MatchReport = {
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  globalScore: number;
  scoreExplanations: { A: string; B: string; C: string; D: string };
  gaps: { requirement: string; isBlocker: boolean; profileHas: string | null; mitigation: string }[];
  topChanges: { section: string; proposed: string; reason: string }[];
  legitimacy: 'HIGH_CONFIDENCE' | 'PROCEED_WITH_CAUTION' | 'SUSPICIOUS';
  legitimacyNotes: string;
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? 'bg-teal-500' : score >= 3 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className="text-sm font-bold w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

export default async function JobResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const { id } = await params;

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) redirect('/sign-in');

  const job = await db.job.findUnique({ where: { id, userId: dbUser.id } });
  if (!job) notFound();

  const t = await getTranslations('job');

  const report = job.matchReport as MatchReport | null;
  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <p className="text-gray-500">{t('pendingEval')}</p>
      </div>
    );
  }

  const scoreColor =
    report.globalScore >= 4 ? 'text-teal-600' : report.globalScore >= 3 ? 'text-amber-600' : 'text-red-500';
  const scoreLabel =
    report.globalScore >= 4.5
      ? t('scoreExceptional')
      : report.globalScore >= 4
        ? t('scoreGood')
        : report.globalScore >= 3
          ? t('scorePossible')
          : t('scorePoor');

  const legitimacyLabels = {
    HIGH_CONFIDENCE: t('legitimacyHigh'),
    PROCEED_WITH_CAUTION: t('legitimacyCaution'),
    SUSPICIOUS: t('legitimacySuspicious'),
  };
  const legitimacyColors = {
    HIGH_CONFIDENCE: 'text-teal-700 bg-teal-50',
    PROCEED_WITH_CAUTION: 'text-amber-700 bg-amber-50',
    SUSPICIOUS: 'text-red-700 bg-red-50',
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div>
        <p className="text-sm text-gray-400 mb-1">{job.company ?? t('unknownCompany')}</p>
        <h1 className="text-2xl font-bold">{job.title ?? t('untitledRole')}</h1>
        <p className="text-xs text-gray-400 mt-1">{job.archetype?.replace(/_/g, ' ')}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
        <p className={`text-6xl font-bold ${scoreColor}`}>{report.globalScore.toFixed(1)}</p>
        <p className="text-sm text-gray-400 mt-1">{t('outOf')} · {scoreLabel}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-sm text-gray-700">{t('scoreBreakdown')}</h2>
        <ScoreBar label={t('cvMatch')} score={report.scoreA} />
        <ScoreBar label={t('alignment')} score={report.scoreB} />
        <ScoreBar label={t('compensation')} score={report.scoreC} />
        <ScoreBar label={t('cultureRemote')} score={report.scoreD} />
        <div className="pt-2 space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map(k => (
            <p key={k} className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{k}:</span> {report.scoreExplanations[k]}
            </p>
          ))}
        </div>
      </div>

      {report.gaps.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">{t('gapAnalysis')}</h2>
          <div className="space-y-3">
            {report.gaps.map((gap, i) => (
              <div key={i} className={`rounded-xl p-3 ${gap.isBlocker ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-bold mt-0.5 ${gap.isBlocker ? 'text-red-600' : 'text-amber-600'}`}>
                    {gap.isBlocker ? t('blocker') : t('gap')}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{gap.requirement}</p>
                    {gap.profileHas && <p className="text-xs text-gray-500 mt-0.5">{t('youHave')} {gap.profileHas}</p>}
                    <p className="text-xs text-gray-600 mt-1 italic">{gap.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-semibold text-sm text-gray-700">{t('legitimacyCheck')}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${legitimacyColors[report.legitimacy]}`}>
            {legitimacyLabels[report.legitimacy]}
          </span>
        </div>
        <p className="text-sm text-gray-500">{report.legitimacyNotes}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {dbUser.plan === 'PRO' ? (
          <div>
            <h2 className="font-semibold mb-2">{t('generateResume')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('generateResumeDesc')}</p>
            <Link
              href={`/jobs/${id}/resume`}
              className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              {t('generateResumeBtn')}
            </Link>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-lg font-semibold mb-1">{t('upgradeTitle')}</p>
            <p className="text-sm text-gray-500 mb-4">{t('upgradeDesc')}</p>
            <UpgradeButton />
          </div>
        )}
      </div>

      {report.topChanges.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">{t('recommendedChanges')}</h2>
          <div className="space-y-3">
            {report.topChanges.map((change, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-gray-700 capitalize">{change.section}: </span>
                <span className="text-gray-600">{change.proposed}</span>
                <p className="text-xs text-gray-400 mt-0.5">{change.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700">
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
