'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ProfileData } from '@/lib/types/profile';

type Props = Pick<ProfileData, 'targetRoles' | 'salaryMin' | 'salaryMax' | 'remotePolicy'>;

const POLICIES: ProfileData['remotePolicy'][] = ['REMOTE_OK', 'HYBRID_OK', 'ONSITE_ONLY'];

function useDebouncedSave(delay = 600) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const save = useCallback((data: Record<string, unknown>) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }, delay);
  }, [delay]);
  return save;
}

export default function CareerTargetsSection(props: Props) {
  const t = useTranslations('profile');
  const router = useRouter();
  const debouncedSave = useDebouncedSave();

  const [roles, setRoles] = useState<string[]>(props.targetRoles);
  const [roleInput, setRoleInput] = useState('');
  const [salaryMin, setSalaryMin] = useState(props.salaryMin?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(props.salaryMax?.toString() ?? '');
  const [remotePolicy, setRemotePolicy] = useState(props.remotePolicy);
  const [savedIndicator, setSavedIndicator] = useState(false);

  function showSaved() {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  }

  function addRole(value: string) {
    const trimmed = value.trim();
    if (!trimmed || roles.includes(trimmed)) return;
    const next = [...roles, trimmed];
    setRoles(next);
    setRoleInput('');
    debouncedSave({ targetRoles: next });
  }

  function removeRole(role: string) {
    const next = roles.filter(r => r !== role);
    setRoles(next);
    debouncedSave({ targetRoles: next });
  }

  function handleRoleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addRole(roleInput); }
    if (e.key === 'Backspace' && !roleInput && roles.length > 0) {
      removeRole(roles[roles.length - 1]);
    }
  }

  async function handleRemotePolicy(policy: ProfileData['remotePolicy']) {
    setRemotePolicy(policy);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remotePolicy: policy }),
    });
    showSaved();
    router.refresh();
  }

  function handleSalaryBlur() {
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
      }),
    }).then(() => { showSaved(); router.refresh(); });
  }

  const remotePolicyLabels: Record<ProfileData['remotePolicy'], string> = {
    REMOTE_OK: t('remotePolicyRemote'),
    HYBRID_OK: t('remotePolicyHybrid'),
    ONSITE_ONLY: t('remotePolicyOnsite'),
  };

  return (
    <section id="targets" className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('sectionCareerTargets')}
        </h2>
        {savedIndicator && <span className="text-xs text-teal-500">{t('autoSaved')} ✓</span>}
      </div>

      <div className="space-y-5">
        {/* Target roles — tag input */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">{t('targetRolesLabelNew')}</label>
          <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500 min-h-[42px]">
            {roles.map(role => (
              <span key={role} className="flex items-center gap-1 bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                {role}
                <button
                  onClick={() => removeRole(role)}
                  className="text-gray-400 hover:text-white leading-none"
                  aria-label={`Remove ${role}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={handleRoleKeyDown}
              onBlur={() => roleInput.trim() && addRole(roleInput)}
              placeholder={roles.length === 0 ? t('targetRolesPlaceholderInput') : ''}
              className="flex-1 min-w-[140px] text-sm outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Salary range */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">Salary range (USD)</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                className={inputCls}
                placeholder="120,000"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                onBlur={handleSalaryBlur}
              />
            </div>
            <span className="text-gray-400 text-sm">–</span>
            <div className="flex-1">
              <input
                type="number"
                className={inputCls}
                placeholder="180,000"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
                onBlur={handleSalaryBlur}
              />
            </div>
          </div>
        </div>

        {/* Remote policy — segmented control */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">{t('remotePolicyLabel')}</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {POLICIES.map(policy => (
              <button
                key={policy}
                onClick={() => handleRemotePolicy(policy)}
                className={`flex-1 text-xs py-2 px-1 transition-colors ${
                  remotePolicy === policy
                    ? 'bg-gray-900 text-white font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {remotePolicyLabels[policy]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
