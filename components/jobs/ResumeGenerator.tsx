'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const LOCALES = ['en', 'pt-BR', 'es'] as const;
type Locale = (typeof LOCALES)[number];

export default function ResumeGenerator({ defaultLanguage }: { defaultLanguage: string }) {
  const { id: jobId } = useParams<{ id: string }>();
  const t = useTranslations('resume');
  const tLangs = useTranslations('languages');
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? t('errorGenFail'));
        return;
      }
      setResumeHtml(data.resumeHtml);
      setResumeId(data.resumeId);
      setGenerated(true);
    } catch {
      setError(t('errorGeneric'));
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
        const blob = new Blob([data.htmlFallback], { type: 'text/html' });
        triggerDownload(URL.createObjectURL(blob), 'resume.html');
        setError(t('errorTimeout'));
        return;
      }

      if (!res.ok) {
        setError(data.message ?? t('errorPdfFail'));
        return;
      }

      const dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
      triggerDownload(dataUrl, `resume-${jobId}.pdf`);
    } catch {
      setError(t('errorDownload'));
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
            {t('backToEval')}
          </Link>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        {generated && (
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              {t('regenerate')}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || !resumeId}
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-50"
            >
              {downloading ? t('downloading') : t('download')}
            </button>
          </div>
        )}
      </div>

      {!generated && !generating && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium block mb-2">{t('languageLabel')}</label>
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {LOCALES.map(locale => (
                <option key={locale} value={locale}>
                  {tLangs(locale)}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              {t('generateBtn')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-amber-600 text-sm mb-4 bg-amber-50 rounded-xl px-4 py-3">{error}</p>}

      {generating && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">{t('generating')}</p>
          <p className="text-xs mt-1">{t('generatingHint')}</p>
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
