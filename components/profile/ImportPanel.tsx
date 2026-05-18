'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ParsedImport, ProfileData } from '@/lib/types/profile';

type State = 'idle' | 'dragging' | 'parsing' | 'preview' | 'importing' | 'success' | 'error';

interface Props {
  currentProfile: ProfileData;
}

export default function ImportPanel({ currentProfile }: Props) {
  const t = useTranslations('profile');
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<State>('idle');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [cvText, setCvText] = useState('');

  async function parsePdf(file: File) {
    setState('parsing');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/import-pdf', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParsed(data);
      setState('preview');
    } catch {
      setError(t('parseError'));
      setState('error');
    }
  }

  async function parseText() {
    if (!cvText.trim()) return;
    setState('parsing');
    setError('');
    try {
      const res = await fetch('/api/profile/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParsed(data);
      setState('preview');
    } catch {
      setError(t('parseError'));
      setState('error');
    }
  }

  async function confirmImport() {
    if (!parsed) return;
    setState('importing');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: currentProfile.fullName,
          email: currentProfile.email,
          location: currentProfile.location,
          linkedinUrl: currentProfile.linkedinUrl,
          portfolioUrl: currentProfile.portfolioUrl,
          narrative: parsed.summary ?? currentProfile.narrative,
          experiences: parsed.experiences,
          skills: parsed.skills,
          education: parsed.education,
          targetRoles: currentProfile.targetRoles,
          salaryMin: currentProfile.salaryMin,
          salaryMax: currentProfile.salaryMax,
          remotePolicy: currentProfile.remotePolicy,
          language: currentProfile.language,
        }),
      });
      if (!res.ok) throw new Error();
      setState('success');
      router.refresh();
      setTimeout(() => { setState('idle'); setParsed(null); setCvText(''); setPasteOpen(false); }, 3000);
    } catch {
      setError(t('importError'));
      setState('error');
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') parsePdf(file);
    else { setError('Only PDF files are supported'); setState('error'); }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parsePdf(file);
    e.target.value = '';
  };

  function reset() {
    setState('idle');
    setParsed(null);
    setError('');
    setCvText('');
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {t('importBtn')}
      </p>

      {state === 'success' ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-1">✓</div>
          <p className="text-sm text-teal-600 font-medium">Profile updated</p>
        </div>
      ) : state === 'parsing' || state === 'importing' ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            {state === 'parsing' ? t('parsing') : t('importing')}
          </p>
        </div>
      ) : state === 'preview' && parsed ? (
        <div>
          <div className="bg-teal-50 rounded-xl p-3 text-sm mb-3">
            <p className="font-medium text-teal-700 mb-1">{t('previewTitle')}</p>
            <p className="text-teal-600 text-xs">
              {t('foundItems', {
                exp: parsed.experiences.length,
                skills: parsed.skills.length,
                edu: parsed.education.length,
              })}
            </p>
          </div>
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <button onClick={confirmImport} className={primaryBtn + ' w-full mb-2'}>
            {t('confirmImport')}
          </button>
          <button onClick={reset} className="w-full text-xs text-gray-500 hover:text-gray-700">
            {t('cancelBtn')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setState('dragging'); }}
            onDragLeave={() => setState('idle')}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              state === 'dragging'
                ? 'border-teal-400 bg-teal-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">📄</div>
            <p className="text-xs font-medium text-gray-700">
              {state === 'dragging' ? t('dragging') : t('dropHere')}
            </p>
            <p className="text-xs text-gray-400">{t('orClickBrowse')}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Error */}
          {state === 'error' && (
            <p className="text-red-500 text-xs">{error}</p>
          )}

          {/* Paste text collapsible */}
          <button
            onClick={() => setPasteOpen(o => !o)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <span className={`transition-transform ${pasteOpen ? 'rotate-90' : ''}`}>▶</span>
            {t('pasteInstead')}
          </button>

          {pasteOpen && (
            <div>
              <textarea
                className="w-full h-28 border border-gray-200 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={t('pastePlaceholder')}
                value={cvText}
                onChange={e => setCvText(e.target.value)}
              />
              <button
                onClick={parseText}
                disabled={!cvText.trim()}
                className={primaryBtn + ' w-full mt-2 disabled:opacity-50'}
              >
                {t('parseBtn')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const primaryBtn = 'bg-gray-900 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-700';
