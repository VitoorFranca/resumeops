'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Education } from '@/lib/types/profile';

function withIds(items: Omit<Education, 'id'>[]): Education[] {
  return items.map(item => ({ ...item, id: crypto.randomUUID() }));
}

function stripIds(items: Education[]): Omit<Education, 'id'>[] {
  return items.map(({ id: _, ...rest }) => rest);
}

export default function EducationSection({ education }: { education: Omit<Education, 'id'>[] }) {
  const t = useTranslations('profile');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Education[]>(() => withIds(education));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ education: stripIds(items) }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setItems(withIds(education));
    setEditing(false);
    setError('');
  }

  function addItem() {
    setItems(prev => [...prev, { id: crypto.randomUUID(), institution: '', degree: '', year: '' }]);
  }

  function updateItem(id: string, field: keyof Omit<Education, 'id'>, value: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  return (
    <section id="education" className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('sectionEducation')}</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-teal-600 hover:text-teal-800">
            {t('editBtn')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('institutionLabel')}</label>
                  <input className={inputCls} value={item.institution} onChange={e => updateItem(item.id, 'institution', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('degreeLabel')}</label>
                  <input className={inputCls} value={item.degree} onChange={e => updateItem(item.id, 'degree', e.target.value)} />
                </div>
                <div className="w-28">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('yearLabel')}</label>
                  <input className={inputCls} value={item.year} onChange={e => updateItem(item.id, 'year', e.target.value)} />
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:text-red-700">{t('deleteBtn')}</button>
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-teal-600 hover:text-teal-800">{t('addEducation')}</button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className={primaryBtn}>
              {saving ? t('saving') : t('saveBtn')}
            </button>
            <button onClick={handleCancel} className={ghostBtn}>{t('cancelEdit')}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {education.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noEducation')}</p>
          ) : (
            education.map((item, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-gray-900">{item.degree}</p>
                <p className="text-gray-500">{item.institution} · {item.year}</p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const primaryBtn = 'bg-gray-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-700';
const ghostBtn = 'text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200';
