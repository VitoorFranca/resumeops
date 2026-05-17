'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ResumePage() {
  const { id: jobId } = useParams<{ id: string }>();
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}/resume`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Resume generation failed. Try again.');
        return;
      }
      setResumeHtml(data.resumeHtml);
      setResumeId(data.resumeId);
      setGenerated(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!resumeId) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();

      if (data.htmlFallback) {
        // PDF timed out — download HTML instead
        const blob = new Blob([data.htmlFallback], { type: 'text/html' });
        triggerDownload(URL.createObjectURL(blob), 'resume.html');
        setError('PDF generation timed out. Resume downloaded as HTML — open in Chrome and print to PDF.');
        return;
      }

      if (!res.ok) {
        setError(data.message ?? 'PDF download failed.');
        return;
      }

      const dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
      triggerDownload(dataUrl, `resume-${jobId}.pdf`);
    } catch {
      setError('Download failed. Try again.');
    } finally {
      setDownloading(false);
    }
  }

  function triggerDownload(href: string, filename: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/jobs/${jobId}`} className="text-sm text-gray-400 hover:text-gray-700 block mb-1">
            ← Back to evaluation
          </Link>
          <h1 className="text-2xl font-bold">Your tailored resume</h1>
        </div>
        {generated && (
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || !resumeId}
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-50"
            >
              {downloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-amber-600 text-sm mb-4 bg-amber-50 rounded-xl px-4 py-3">{error}</p>}

      {generating && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">Generating your tailored resume...</p>
          <p className="text-xs mt-1">This takes about 15 seconds</p>
        </div>
      )}

      {resumeHtml && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <iframe
            srcDoc={resumeHtml}
            className="w-full"
            style={{ height: '1100px', border: 'none' }}
            title="Resume preview"
          />
        </div>
      )}
    </div>
  );
}
