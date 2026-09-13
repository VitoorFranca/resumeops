import type { JobExtraction } from '../../lib/types';
import { Header } from '../App';

const SITE_BADGES: Record<string, { label: string; color: string }> = {
  'linkedin.com': { label: 'LinkedIn', color: '#0077b5' },
  'gupy.io': { label: 'Gupy', color: '#6366f1' },
  'greenhouse.io': { label: 'Greenhouse', color: '#24a148' },
  'lever.co': { label: 'Lever', color: '#f97316' },
  'ashbyhq.com': { label: 'Ashby', color: '#8b5cf6' },
};

function getSiteBadge(url: string) {
  for (const [domain, badge] of Object.entries(SITE_BADGES)) {
    if (url.includes(domain)) return badge;
  }
  return { label: 'Job Board', color: '#6b7280' };
}

interface Props {
  job: JobExtraction;
  onAnalyze: () => void;
}

export function JobPreview({ job, onAnalyze }: Props) {
  const badge = getSiteBadge(job.sourceUrl);
  const tooShort = job.rawText.length < 300;

  return (
    <div style={{ padding: '20px' }}>
      <Header />

      <div style={{
        marginTop: 20, background: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb', padding: '16px',
      }}>
        {/* Site badge */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px',
            borderRadius: 99, fontSize: 11, fontWeight: 600,
            background: badge.color + '18', color: badge.color,
          }}>
            {badge.label}
          </span>
        </div>

        {/* Job title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 4 }}>
          {job.title ?? 'Job Opening'}
        </div>

        {/* Company */}
        {job.company && (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            {job.company}
          </div>
        )}

        {/* Text length indicator */}
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          {job.rawText.length.toLocaleString()} characters extracted
        </div>

        {tooShort && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 8, padding: '8px 12px', marginBottom: 14,
            fontSize: 12, color: '#92400e',
          }}>
            ⚠️ Short description detected — results may be less accurate.
          </div>
        )}

        <button
          onClick={onAnalyze}
          style={{
            width: '100%', padding: '11px 16px',
            background: '#111827', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Analyze This Job
        </button>
      </div>
    </div>
  );
}
