'use client';

import { useTranslations } from 'next-intl';

export interface CompletenessItem {
  key: string;
  label: string;
  weight: number;
  filled: boolean;
  href: string;
}

interface Props {
  score: number;
  items: CompletenessItem[];
}

export default function CompletenessRing({ score, items: rawItems }: Props) {
  const t = useTranslations('profile');

  const radius = 38;
  const strokeWidth = 8;
  const size = 96;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const color =
    score >= 80 ? '#14b8a6' :
    score >= 40 ? '#eab308' :
    '#ef4444';

  const isGreat = score >= 80;

  const items = rawItems.map(item => ({
    ...item,
    label: t(`completenessItems.${item.key}` as Parameters<typeof t>[0]),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        {t('completeness')}
      </p>

      {/* Ring with centered text overlay */}
      <div className="relative mx-auto mb-4" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Text centered over the ring */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-xl font-bold leading-none" style={{ color }}>{score}%</span>
          <span className="text-xs text-gray-400 mt-0.5">complete</span>
        </div>
      </div>

      {isGreat ? (
        <p className="text-sm text-teal-600 font-medium text-center">{t('completenessGreat')}</p>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.key}>
              <a
                href={item.href}
                className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 -mx-2 transition-colors ${
                  item.filled
                    ? 'text-gray-400'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <span className={`shrink-0 ${item.filled ? 'text-teal-500' : 'text-gray-300'}`}>
                  {item.filled ? '✓' : '○'}
                </span>
                <span className={item.filled ? 'line-through opacity-60' : ''}>{item.label}</span>
                {!item.filled && (
                  <span className="ml-auto text-gray-300 shrink-0">+{item.weight}%</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
