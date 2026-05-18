'use client';

import CompletenessRing, { type CompletenessItem } from './CompletenessRing';
import ImportPanel from './ImportPanel';
import type { ProfileData } from '@/lib/types/profile';

interface Props {
  score: number;
  items: CompletenessItem[];
  currentProfile: ProfileData;
}

export default function ProfileSidebar({ score, items, currentProfile }: Props) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="lg:sticky lg:top-8 space-y-4">
        <CompletenessRing score={score} items={items} />
        <ImportPanel currentProfile={currentProfile} />
      </div>
    </aside>
  );
}
