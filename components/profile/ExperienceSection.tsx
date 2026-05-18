'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Experience } from '@/lib/types/profile';

function withIds(items: Omit<Experience, 'id'>[]): Experience[] {
  return items.map(item => ({ ...item, id: crypto.randomUUID() }));
}

function stripIds(items: Experience[]): Omit<Experience, 'id'>[] {
  return items.map(({ id: _, ...rest }) => rest);
}

export default function ExperienceSection({ experiences }: { experiences: Omit<Experience, 'id'>[] }) {
  const t = useTranslations('profile');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Experience[]>(() => withIds(experiences));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiences: stripIds(items) }),
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
    setItems(withIds(experiences));
    setEditing(false);
    setError('');
  }

  function addItem() {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      company: '',
      role: '',
      startDate: '',
      endDate: null,
      bullets: [''],
      skillsUsed: [],
    }]);
  }

  function updateItem<K extends keyof Omit<Experience, 'id'>>(id: string, field: K, value: Experience[K]) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  function addBullet(id: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, bullets: [...item.bullets, ''] } : item));
  }

  function updateBullet(id: string, index: number, value: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const bullets = [...item.bullets];
      bullets[index] = value;
      return { ...item, bullets };
    }));
  }

  function removeBullet(id: string, index: number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, bullets: item.bullets.filter((_, i) => i !== index) };
    }));
  }

  function formatDateRange(exp: Omit<Experience, 'id'>) {
    return `${exp.startDate} – ${exp.endDate ?? t('present')}`;
  }

  return (
    <section id="experience" className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('sectionExperience')}</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-teal-600 hover:text-teal-800">
            {t('editBtn')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('companyLabel')}</label>
                  <input className={inputCls} value={item.company} onChange={e => updateItem(item.id, 'company', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('roleLabel')}</label>
                  <input className={inputCls} value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('startDateLabel')}</label>
                  <input className={inputCls} value={item.startDate} placeholder="2022-01" onChange={e => updateItem(item.id, 'startDate', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">{t('endDateLabel')}</label>
                  <input className={inputCls} value={item.endDate ?? ''} placeholder={t('present')} onChange={e => updateItem(item.id, 'endDate', e.target.value || null)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{t('bulletsLabel')}</label>
                <div className="space-y-2">
                  {item.bullets.map((bullet, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={inputCls}
                        value={bullet}
                        onChange={e => updateBullet(item.id, i, e.target.value)}
                        placeholder="Describe an achievement..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); addBullet(item.id); }
                          if (e.key === 'Backspace' && bullet === '') { e.preventDefault(); removeBullet(item.id, i); }
                        }}
                      />
                      <button onClick={() => removeBullet(item.id, i)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addBullet(item.id)} className="text-xs text-teal-600 hover:text-teal-800">{t('addBullet')}</button>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:text-red-700">{t('deleteBtn')}</button>
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-teal-600 hover:text-teal-800">{t('addExperience')}</button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className={primaryBtn}>
              {saving ? t('saving') : t('saveBtn')}
            </button>
            <button onClick={handleCancel} className={ghostBtn}>{t('cancelEdit')}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {experiences.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noExperiences')}</p>
          ) : (
            experiences.map((exp, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{exp.role}</p>
                    <p className="text-gray-500">{exp.company} · {formatDateRange(exp)}</p>
                  </div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
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
