'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Step = 'cv' | 'targets';

interface ParsedCV {
  experiences: unknown[];
  skills: unknown[];
  education: unknown[];
  summary: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [step, setStep] = useState<Step>('cv');
  const [cvText, setCvText] = useState('');
  const [parsed, setParsed] = useState<ParsedCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetRoles, setTargetRoles] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [error, setError] = useState('');

  async function handleParseCV() {
    if (!cvText.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText }),
      });
      if (!res.ok) throw new Error('Parse failed');
      const data = await res.json();
      setParsed(data);
      setStep('targets');
    } catch {
      setError(t('parseError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    if (!parsed) return;
    setLoading(true);
    setError('');
    try {
      const roles = targetRoles.split(',').map(r => r.trim()).filter(Boolean);
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed,
          cvRaw: cvText,
          targetRoles: roles,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
          salaryMax: salaryMax ? parseInt(salaryMax) : null,
        }),
      });
      router.push('/dashboard');
    } catch {
      setError(t('saveError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8">
        {step === 'cv' ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{t('pasteTitle')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('pasteDesc')}</p>
            <textarea
              className="w-full h-56 border border-gray-200 rounded-xl p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={t('pastePlaceholder')}
              value={cvText}
              onChange={e => setCvText(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleParseCV}
              disabled={loading || !cvText.trim()}
              className="mt-4 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-700"
            >
              {loading ? t('parsing') : t('parseBtn')}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">{t('almostTitle')}</h1>
            {parsed && (
              <p className="text-sm text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mb-6">
                {t('foundItems', {
                  exp: (parsed.experiences as unknown[]).length,
                  skills: (parsed.skills as unknown[]).length,
                  edu: (parsed.education as unknown[]).length,
                })}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{t('targetRolesLabel')}</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={t('targetRolesPlaceholder')}
                  value={targetRoles}
                  onChange={e => setTargetRoles(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">{t('salaryMin')}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="120000"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">{t('salaryMax')}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="180000"
                    value={salaryMax}
                    onChange={e => setSalaryMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleFinish}
              disabled={loading}
              className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-700"
            >
              {loading ? t('saving') : t('startBtn')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
