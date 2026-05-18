'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export type Application = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  jobId: string;
  job: { title: string | null; company: string | null; matchScore: number | null; url: string | null };
};

function scoreClass(score: number | null): string {
  if (score == null) return 'text-gray-400 bg-gray-50';
  if (score >= 4) return 'text-teal-600 bg-teal-50';
  if (score >= 3) return 'text-amber-600 bg-amber-50';
  return 'text-red-500 bg-red-50';
}

export default function JobCard({ app, isOverlay }: { app: Application; isOverlay?: boolean }) {
  const t = useTranslations('applications');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    disabled: isOverlay,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      className={`bg-white rounded-lg border border-gray-100 p-3 select-none transition-shadow ${
        isOverlay
          ? 'shadow-lg rotate-1 cursor-grabbing'
          : isDragging
          ? 'opacity-30 cursor-grabbing'
          : 'shadow-sm hover:shadow-md cursor-grab'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
            {app.job.company ?? '—'}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5 leading-tight">
            {app.job.title ?? '—'}
          </p>
        </div>
        {app.job.matchScore != null && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${scoreClass(app.job.matchScore)}`}>
            {app.job.matchScore.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50">
        <Link
          href={`/jobs/${app.jobId}`}
          onClick={e => e.stopPropagation()}
          className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
        >
          {t('viewLink')}
        </Link>
        <Link
          href={`/jobs/${app.jobId}`}
          onClick={e => e.stopPropagation()}
          className="text-xs text-teal-600 hover:underline transition-colors"
        >
          {t('resumeLink')}
        </Link>
      </div>
    </div>
  );
}
