'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'cv' | 'targets';

interface ParsedCV {
  experiences: unknown[];
  skills: unknown[];
  education: unknown[];
  summary: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
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
      setError('Could not parse your CV. Try again or paste more text.');
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
      setError('Could not save your profile. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8">
        {step === 'cv' ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Paste your CV</h1>
            <p className="text-gray-500 text-sm mb-6">
              Plain text, markdown, or copy-paste from Word. We extract your experience, skills, and education.
            </p>
            <textarea
              className="w-full h-56 border border-gray-200 rounded-xl p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Paste your CV here..."
              value={cvText}
              onChange={e => setCvText(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={handleParseCV}
              disabled={loading || !cvText.trim()}
              className="mt-4 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-700"
            >
              {loading ? 'Parsing...' : 'Parse my CV →'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Almost done</h1>
            {parsed && (
              <p className="text-sm text-teal-700 bg-teal-50 rounded-lg px-3 py-2 mb-6">
                Found {(parsed.experiences as unknown[]).length} experiences · {(parsed.skills as unknown[]).length} skills · {(parsed.education as unknown[]).length} education items
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Target roles (comma-separated)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Senior AI Engineer, Staff Platform Engineer"
                  value={targetRoles}
                  onChange={e => setTargetRoles(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Salary min (USD)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="120000"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Salary max (USD)</label>
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
              {loading ? 'Saving...' : 'Start evaluating →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
