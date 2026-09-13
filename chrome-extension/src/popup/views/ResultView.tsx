import type { EvaluationResult, Gap } from '../../lib/types';
import { Header } from '../App';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// SVG ring parameters
const R = 38;
const STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * R;

function scoreColor(score: number): string {
  if (score >= 4) return '#14b8a6';
  if (score >= 3) return '#f59e0b';
  return '#ef4444';
}

function scoreBg(score: number): string {
  if (score >= 4) return '#f0fdfa';
  if (score >= 3) return '#fffbeb';
  return '#fef2f2';
}

function scoreLabel(score: number): string {
  if (score >= 4.5) return 'Excellent Match';
  if (score >= 4) return 'Strong Match';
  if (score >= 3) return 'Moderate Match';
  return 'Weak Match';
}

function ScoreRing({ score }: { score: number }) {
  const offset = CIRCUMFERENCE * (1 - score / 5);
  const color = scoreColor(score);
  const bg = scoreBg(score);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px', background: bg, borderRadius: 16, gap: 4,
    }}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        {/* Track */}
        <circle cx={48} cy={48} r={R} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
        {/* Progress */}
        <circle
          cx={48} cy={48} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={48} y={53} textAnchor="middle" fontSize={22} fontWeight={700} fill={color} fontFamily="system-ui">
          {score.toFixed(1)}
        </text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 600, color, textAlign: 'center' }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#9ca3af', width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 99, height: 6 }}>
        <div style={{
          width: `${(score / 5) * 100}%`, height: 6,
          borderRadius: 99, background: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 24, textAlign: 'right' }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function LegitimacyBadge({ value }: { value: EvaluationResult['legitimacy'] }) {
  const map = {
    HIGH_CONFIDENCE: { label: 'Legitimate', color: '#059669', bg: '#ecfdf5' },
    PROCEED_WITH_CAUTION: { label: 'Verify First', color: '#d97706', bg: '#fffbeb' },
    SUSPICIOUS: { label: 'Suspicious', color: '#dc2626', bg: '#fef2f2' },
  };
  const { label, color, bg } = map[value];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: bg, color,
    }}>
      {label}
    </span>
  );
}

function GapItem({ gap }: { gap: Gap }) {
  const color = gap.isBlocker ? '#dc2626' : '#d97706';
  const bg = gap.isBlocker ? '#fef2f2' : '#fffbeb';
  return (
    <div style={{
      padding: '10px 12px', background: bg,
      borderRadius: 10, borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 2 }}>
        {gap.isBlocker ? '🚫' : '⚠️'} {gap.requirement}
      </div>
      {gap.mitigation && (
        <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
          {gap.mitigation}
        </div>
      )}
    </div>
  );
}

interface Props {
  data: EvaluationResult;
}

export function ResultView({ data }: Props) {
  const topGaps = data.gaps.slice(0, 3);
  const blockers = topGaps.filter(g => g.isBlocker);
  const warnings = topGaps.filter(g => !g.isBlocker);
  const displayGaps = [...blockers, ...warnings].slice(0, 3);

  return (
    <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Header />

      {/* Score section */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <ScoreRing score={data.globalScore} />

        {/* Score breakdown */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 16,
          border: '1px solid #e5e7eb', padding: '12px',
          display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center',
        }}>
          <ScoreBar label="CV Match" score={data.scoreA} />
          <ScoreBar label="Role Fit" score={data.scoreB} />
          <ScoreBar label="Compensation" score={data.scoreC} />
          <ScoreBar label="Remote" score={data.scoreD} />
        </div>
      </div>

      {/* Legitimacy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LegitimacyBadge value={data.legitimacy} />
        {data.title && (
          <span style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.title}
            {data.company ? ` · ${data.company}` : ''}
          </span>
        )}
      </div>

      {/* Gaps */}
      {displayGaps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Key Gaps
          </div>
          {displayGaps.map((gap, i) => <GapItem key={i} gap={gap} />)}
          {data.gaps.length > 3 && (
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              +{data.gaps.length - 3} more gaps in full report
            </div>
          )}
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => chrome.tabs.create({ url: `${BASE_URL}/jobs/${data.jobId}` })}
          style={{
            width: '100%', padding: '10px 16px',
            background: '#111827', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          View Full Report →
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: `${BASE_URL}/jobs/${data.jobId}/resume` })}
          style={{
            width: '100%', padding: '10px 16px',
            background: '#f0fdfa', color: '#0f766e',
            border: '1px solid #99f6e4',
            borderRadius: 12, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Generate Tailored Resume ✨
        </button>
      </div>
    </div>
  );
}
