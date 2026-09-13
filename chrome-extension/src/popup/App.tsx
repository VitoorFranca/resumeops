import { useEffect, useState } from 'react';
import { JobPreview } from './views/JobPreview';
import { LoadingView } from './views/LoadingView';
import { ResultView } from './views/ResultView';
import { ErrorView } from './views/ErrorView';
import { AuthView } from './views/AuthView';
import { callEvaluate } from '../lib/api';
import { isSignedIn } from '../lib/auth';
import { getJobFromActiveTab, extractFromActiveTabDirectly } from '../lib/storage';
import type { JobExtraction, EvaluationResult } from '../lib/types';

type AppState =
  | { phase: 'loading' }
  | { phase: 'signed_out' }
  | { phase: 'no_job' }
  | { phase: 'job_ready'; job: JobExtraction }
  | { phase: 'evaluating'; job: JobExtraction; step: 0 | 1 | 2 }
  | { phase: 'result'; data: EvaluationResult }
  | { phase: 'error'; errorBody: unknown; job: JobExtraction | null };

export default function App() {
  const [state, setState] = useState<AppState>({ phase: 'loading' });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    // 1. Check auth first — decode JWT to verify it's not expired
    const authenticated = await isSignedIn();
    if (!authenticated) {
      setState({ phase: 'signed_out' });
      return;
    }

    // 2. Read job from storage directly (avoids background SW window context issue).
    //    Retry up to 3× with 600ms gaps for slow-loading pages.
    const job = await pollForJob(3, 600);
    if (job) {
      setState({ phase: 'job_ready', job });
    } else {
      setState({ phase: 'no_job' });
    }
  }

  async function handleAnalyze(job: JobExtraction) {
    setState({ phase: 'evaluating', job, step: 0 });
    const t1 = setTimeout(() => setState({ phase: 'evaluating', job, step: 1 }), 1200);
    const t2 = setTimeout(() => setState({ phase: 'evaluating', job, step: 2 }), 5000);
    try {
      const result = await callEvaluate(job.rawText);
      clearTimeout(t1); clearTimeout(t2);
      setState({ phase: 'result', data: result });
    } catch (e) {
      clearTimeout(t1); clearTimeout(t2);
      // Re-check auth on 401 — token may have expired between popup open and analyze click
      if ((e as { status?: number }).status === 401) {
        setState({ phase: 'signed_out' });
        return;
      }
      setState({ phase: 'error', errorBody: e, job });
    }
  }

  switch (state.phase) {
    case 'loading':
      return <LoadingView step={0} message="Checking session…" />;
    case 'signed_out':
      return <AuthView />;
    case 'no_job':
      return <NoJobView onRetry={init} />;
    case 'job_ready':
      return <JobPreview job={state.job} onAnalyze={() => handleAnalyze(state.job)} />;
    case 'evaluating':
      return <LoadingView step={state.step} />;
    case 'result':
      return <ResultView data={state.data} />;
    case 'error':
      return (
        <ErrorView
          error={state.errorBody}
          onRetry={state.job ? () => handleAnalyze(state.job!) : undefined}
        />
      );
  }
}

async function pollForJob(attempts: number, delayMs: number): Promise<JobExtraction | null> {
  for (let i = 0; i < attempts; i++) {
    const job = await getJobFromActiveTab();
    if (job && job.rawText.length >= 80) return job;
    if (i < attempts - 1) await sleep(delayMs);
  }
  // Content script may have missed the page — inject directly as last resort
  return extractFromActiveTabDirectly();
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function NoJobView({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <Header />
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
          No job detected on this page.
          <br />
          Navigate to a job posting on LinkedIn, Greenhouse, Gupy, Lever, or Ashby.
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px', background: '#f3f4f6', color: '#374151',
            border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13,
            fontWeight: 500, cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
        ResumeOps
      </span>
    </div>
  );
}
