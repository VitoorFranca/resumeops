'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import KanbanColumn from './KanbanColumn';
import JobCard, { Application } from './JobCard';

export default function KanbanBoard({ applications: initial }: { applications: Application[] }) {
  const t = useTranslations('applications');
  const [applications, setApplications] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);

  const COLUMNS = [
    { status: 'Evaluated', label: t('colEvaluated') },
    { status: 'Applied', label: t('colApplied') },
    { status: 'Interview', label: t('colInterview') },
    { status: 'Offer', label: t('colOffer') },
    { status: 'Rejected', label: t('colRejected') },
  ];

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const appId = active.id as string;
    const newStatus = over.id as string;
    const app = applications.find(a => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApplications(prev =>
      prev.map(a => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const activeApp = activeId ? applications.find(a => a.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto h-full px-6 pb-4 pt-1">
        {COLUMNS.map(col => {
          const colApps = applications.filter(a =>
            col.status === 'Rejected'
              ? a.status === 'Rejected' || a.status === 'Discarded'
              : a.status === col.status
          );
          return (
            <KanbanColumn
              key={col.status}
              column={col}
              apps={colApps}
              activeId={activeId}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? <JobCard app={activeApp} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
