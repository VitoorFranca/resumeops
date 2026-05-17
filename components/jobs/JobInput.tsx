'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('jobInput');
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
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl(input) ? { url: input } : { rawText: input }),
      });
      const jobData = await jobRes.json();

      if (!jobRes.ok) {
        if (jobData.error === 'linkedin_url') {
          setError(t('errorLinkedin'));
        } else {
          setError(jobData.message ?? t('errorFetch'));
        }
        setLoading(false);
        return;
      }

      setStepIdx(1);

      const evalRes = await fetch(`/api/jobs/${jobData.jobId}/evaluate`, { method: 'POST' });
      const evalData = await evalRes.json();

      if (!evalRes.ok) {
        if (evalRes.status === 402) {
          setError(t('errorQuota'));
        } else {
          setError(evalData.message ?? t('errorEval'));
        }
        setLoading(false);
        return;
      }

      setStepIdx(2);
      router.push(`/jobs/${jobData.jobId}`);
    } catch {
      setError(t('errorGeneric'));
      setLoading(false);
    }
  }

  const PROGRESS_STEPS = [t('fetching'), t('matching'), t('scoring')];

  return (
    <div>
      <textarea
        className="w-full h-32 border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        placeholder={t('placeholder')}
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
          {t('evaluate')}
        </button>
      )}
    </div>
  );
}
