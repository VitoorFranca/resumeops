'use client';

import { useDroppable } from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import JobCard, { Application } from './JobCard';

export type ColumnConfig = {
  status: string;
  label: string;
};

export default function KanbanColumn({
  column,
  apps,
  activeId,
}: {
  column: ColumnConfig;
  apps: Application[];
  activeId: string | null;
}) {
  const t = useTranslations('applications');
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className="w-64 shrink-0 flex flex-col rounded-xl overflow-hidden">
      <div className="bg-gray-100 px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 truncate">
          {column.label}
        </span>
        {apps.length > 0 && (
          <span className="text-xs font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded-full ml-2 shrink-0">
            {apps.length}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 p-2 overflow-y-auto transition-colors min-h-24 ${
          isOver ? 'bg-teal-50 ring-2 ring-teal-300 ring-inset' : 'bg-gray-50'
        }`}
      >
        {apps.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400 mt-1">
            {t('emptyColumn')}
          </div>
        ) : (
          apps.map(app => (
            <JobCard key={app.id} app={app} />
          ))
        )}
      </div>
    </div>
  );
}
