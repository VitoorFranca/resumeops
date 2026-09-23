'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LOCALES = ['en', 'pt-BR', 'es'] as const;

export default function LanguageSelect({ currentLanguage }: { currentLanguage: string }) {
  const t = useTranslations('languages');
  const tSettings = useTranslations('settings');
  const router = useRouter();
  const [value, setValue] = useState<string>(currentLanguage);
  const [saving, setSaving] = useState(false);

  async function handleChange(lang: string) {
    setValue(lang);
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
      <h2 className="font-semibold mb-1">{tSettings('languageSection')}</h2>
      <p className="text-sm text-gray-500 mb-4">{tSettings('languageDesc')}</p>
      <div className="flex items-center gap-3">
        <select
          value={value}
          onChange={e => handleChange(e.target.value)}
          disabled={saving}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        >
          {LOCALES.map(locale => (
            <option key={locale} value={locale}>
              {t(locale)}
            </option>
          ))}
        </select>
        {saving && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
      </div>
    </div>
  );
}
