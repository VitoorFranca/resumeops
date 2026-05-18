'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ProfileData } from '@/lib/types/profile';

type PersonalFields = Pick<ProfileData, 'fullName' | 'email' | 'location' | 'linkedinUrl' | 'portfolioUrl' | 'narrative'>;
type FieldKey = keyof PersonalFields;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function narrativeQuality(text: string | null): { label: string; color: string } | null {
  if (!text) return null;
  const len = text.length;
  if (len < 100) return { label: 'brief', color: 'text-orange-500' };
  if (len <= 400) return { label: 'good', color: 'text-teal-600' };
  return { label: 'detailed', color: 'text-blue-600' };
}

interface InlineFieldProps {
  label: string;
  value: string | null;
  fieldKey: FieldKey;
  multiline?: boolean;
  placeholder?: string;
  onSave: (key: FieldKey, value: string | null) => Promise<void>;
  status: SaveStatus;
}

function InlineField({ label, value, fieldKey, multiline = false, placeholder, onSave, status }: InlineFieldProps) {
  const t = useTranslations('profile');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    // Sync from parent when not editing
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); handleBlur(); }
  }

  async function handleBlur() {
    if (draft === (value ?? '')) { setEditing(false); return; }
    await onSave(fieldKey, draft || null);
    setEditing(false);
  }

  const quality = fieldKey === 'narrative' ? narrativeQuality(draft) : null;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-0.5">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        {status === 'saved' && <span className="text-xs text-teal-500">{t('autoSaved')} ✓</span>}
        {status === 'saving' && <span className="text-xs text-gray-400">Saving…</span>}
        {status === 'error' && <span className="text-xs text-red-500">{t('saveError')}</span>}
      </div>

      {editing ? (
        multiline ? (
          <div>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full border border-teal-400 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {quality && (
              <p className={`text-xs mt-1 ${quality.color}`}>
                {draft.length} chars · {t(`narrativeQuality${quality.label.charAt(0).toUpperCase()}${quality.label.slice(1)}` as Parameters<typeof t>[0])}
              </p>
            )}
          </div>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full border border-teal-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        )
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-sm text-gray-800 cursor-text rounded-lg px-3 py-2 -mx-3 hover:bg-gray-50 transition-colors min-h-[36px] flex items-center"
          title={t('clickToEdit')}
        >
          {value ? (
            <span className={multiline ? 'whitespace-pre-line' : ''}>{value}</span>
          ) : (
            <span className="text-gray-300 italic">{placeholder ?? label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PersonalInfoSection(props: PersonalFields) {
  const t = useTranslations('profile');
  const router = useRouter();
  const [data, setData] = useState(props);
  const [statuses, setStatuses] = useState<Record<FieldKey, SaveStatus>>({
    fullName: 'idle', email: 'idle', location: 'idle',
    linkedinUrl: 'idle', portfolioUrl: 'idle', narrative: 'idle',
  });

  async function handleSave(key: FieldKey, value: string | null) {
    setStatuses(s => ({ ...s, [key]: 'saving' }));
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      setData(d => ({ ...d, [key]: value }));
      setStatuses(s => ({ ...s, [key]: 'saved' }));
      setTimeout(() => setStatuses(s => ({ ...s, [key]: 'idle' })), 2000);
      router.refresh();
    } catch {
      setStatuses(s => ({ ...s, [key]: 'error' }));
      setTimeout(() => setStatuses(s => ({ ...s, [key]: 'idle' })), 3000);
    }
  }

  return (
    <section id="personal" className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
        {t('sectionPersonal')}
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InlineField label={t('fullNameLabel')} value={data.fullName} fieldKey="fullName" onSave={handleSave} status={statuses.fullName} />
          <InlineField label={t('locationLabel')} value={data.location} fieldKey="location" onSave={handleSave} status={statuses.location} />
        </div>
        <InlineField label={t('emailLabel')} value={data.email} fieldKey="email" onSave={handleSave} status={statuses.email} />
        <div className="grid grid-cols-2 gap-4">
          <InlineField label={t('linkedinLabel')} value={data.linkedinUrl} fieldKey="linkedinUrl" placeholder="https://linkedin.com/in/…" onSave={handleSave} status={statuses.linkedinUrl} />
          <InlineField label={t('portfolioLabel')} value={data.portfolioUrl} fieldKey="portfolioUrl" placeholder="https://…" onSave={handleSave} status={statuses.portfolioUrl} />
        </div>
        <InlineField label={t('narrativeLabel')} value={data.narrative} fieldKey="narrative" multiline onSave={handleSave} status={statuses.narrative} />
      </div>
    </section>
  );
}
