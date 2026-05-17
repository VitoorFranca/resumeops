'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROGRESS_STEPS = ['Fetching job...', 'Matching your profile...', 'Scoring...'];

function isUrl(s: string) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export default function JobInput() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState('');

  async function handleEvaluate() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setStepIdx(0);

    try {
      // Step 1: create job
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl(input) ? { url: input } : { rawText: input }),
      });
      const jobData = await jobRes.json();

      if (!jobRes.ok) {
        if (jobData.error === 'linkedin_url') {
          setError('LinkedIn URLs require login. Paste the job description text directly.');
        } else {
          setError(jobData.message ?? "Couldn't fetch that URL. Paste the job description text instead.");
        }
        setLoading(false);
        return;
      }

      setStepIdx(1);

      // Step 2: evaluate
      const evalRes = await fetch(`/api/jobs/${jobData.jobId}/evaluate`, { method: 'POST' });
      const evalData = await evalRes.json();

      if (!evalRes.ok) {
        if (evalRes.status === 402) {
          setError("You've used all your free evaluations. Upgrade to Pro for unlimited access.");
        } else {
          setError(evalData.message ?? 'Evaluation failed. Try again.');
        }
        setLoading(false);
        return;
      }

      setStepIdx(2);
      router.push(`/jobs/${jobData.jobId}`);
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        className="w-full h-32 border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        placeholder="Paste a job URL or the full job description..."
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          {PROGRESS_STEPS[stepIdx]}
        </div>
      ) : (
        <button
          onClick={handleEvaluate}
          disabled={!input.trim()}
          className="mt-3 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-700"
        >
          Evaluate →
        </button>
      )}
    </div>
  );
}
