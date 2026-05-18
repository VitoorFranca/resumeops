'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Skill } from '@/lib/types/profile';

const CATEGORIES: Skill['category'][] = ['language', 'framework', 'cloud', 'database', 'ai_ml', 'devops', 'soft', 'domain'];
const LEVELS: Skill['level'][] = ['basic', 'intermediate', 'advanced', 'expert'];

const levelColors: Record<Skill['level'], string> = {
  basic: 'bg-gray-100 text-gray-600',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced: 'bg-teal-50 text-teal-700',
  expert: 'bg-purple-50 text-purple-700',
};

const levelDotColors: Record<Skill['level'], string> = {
  basic: 'bg-gray-400',
  intermediate: 'bg-blue-500',
  advanced: 'bg-teal-500',
  expert: 'bg-purple-500',
};

function withIds(items: Omit<Skill, 'id'>[]): Skill[] {
  return items.map(item => ({ ...item, id: crypto.randomUUID() }));
}

function stripIds(items: Skill[]): Omit<Skill, 'id'>[] {
  return items.map(({ id: _, ...rest }) => rest);
}

function LevelPicker({ currentLevel, onChange }: { currentLevel: Skill['level']; onChange: (l: Skill['level']) => void }) {
  const t = useTranslations('profile');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border border-transparent hover:border-gray-300 ${levelColors[currentLevel]}`}
        title={t('levelPicker')}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${levelDotColors[currentLevel]}`} />
        {currentLevel}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[110px]">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={e => { e.stopPropagation(); onChange(level); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${
                level === currentLevel ? 'font-semibold' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${levelDotColors[level]}`} />
              {t(`skillLevels.${level}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillsSection({ skills }: { skills: Omit<Skill, 'id'>[] }) {
  const t = useTranslations('profile');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Skill[]>(() => withIds(skills));
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<Skill['category']>('language');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: stripIds(items) }),
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
    setItems(withIds(skills));
    setEditing(false);
    setError('');
    setNameInput('');
  }

  function addSkill() {
    const name = nameInput.trim();
    if (!name) return;
    if (items.some(s => s.name.toLowerCase() === name.toLowerCase())) { setNameInput(''); return; }
    setItems(prev => [...prev, { id: crypto.randomUUID(), name, category: categoryInput, level: 'intermediate' }]);
    setNameInput('');
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  }

  function updateLevel(id: string, level: Skill['level']) {
    setItems(prev => prev.map(s => s.id === id ? { ...s, level } : s));
  }

  function removeSkill(id: string) {
    setItems(prev => prev.filter(s => s.id !== id));
  }

  const grouped = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <section id="skills" className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('sectionSkills')}</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-teal-600 hover:text-teal-800">
            {t('editBtn')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Tag input for adding */}
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Skill name (press Enter to add)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value as Skill['category'])}
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{t(`skillCategories.${c}` as Parameters<typeof t>[0])}</option>
              ))}
            </select>
          </div>

          {/* Chip list grouped by category */}
          {CATEGORIES.filter(cat => items.some(s => s.category === cat)).map(cat => (
            <div key={cat}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {t(`skillCategories.${cat}` as Parameters<typeof t>[0])}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.filter(s => s.category === cat).map(skill => (
                  <span
                    key={skill.id}
                    className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1.5 py-1"
                  >
                    <span className="text-sm text-gray-800">{skill.name}</span>
                    <LevelPicker currentLevel={skill.level} onChange={level => updateLevel(skill.id, level)} />
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="text-gray-300 hover:text-red-400 text-base leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-gray-400">{t('noSkills')}</p>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className={primaryBtn}>
              {saving ? t('saving') : t('saveBtn')}
            </button>
            <button onClick={handleCancel} className={ghostBtn}>{t('cancelEdit')}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noSkills')}</p>
          ) : (
            Object.entries(grouped).map(([category, catSkills]) => (
              <div key={category}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  {t(`skillCategories.${category as Skill['category']}` as Parameters<typeof t>[0])}
                </p>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${levelColors[skill.level as Skill['level']]}`}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

const primaryBtn = 'bg-gray-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-700';
const ghostBtn = 'text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200';
