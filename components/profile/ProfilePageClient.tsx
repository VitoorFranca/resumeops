'use client';

import { useTranslations } from 'next-intl';
import type { ProfileData } from '@/lib/types/profile';
import type { CompletenessItem } from './CompletenessRing';
import PersonalInfoSection from './PersonalInfoSection';
import ExperienceSection from './ExperienceSection';
import SkillsSection from './SkillsSection';
import EducationSection from './EducationSection';
import CareerTargetsSection from './CareerTargetsSection';
import ProfileSidebar from './ProfileSidebar';

function computeCompleteness(profile: ProfileData): { score: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    {
      key: 'identity',
      label: '',
      weight: 10,
      filled: !!profile.fullName && !!profile.location,
      href: '#personal',
    },
    {
      key: 'narrative',
      label: '',
      weight: 15,
      filled: (profile.narrative?.length ?? 0) >= 100,
      href: '#about',
    },
    {
      key: 'experience',
      label: '',
      weight: 25,
      filled: profile.experiences.length > 0,
      href: '#experience',
    },
    {
      key: 'bullets',
      label: '',
      weight: 15,
      filled: profile.experiences.some(e => e.bullets.length >= 2),
      href: '#experience',
    },
    {
      key: 'skills',
      label: '',
      weight: 20,
      filled: profile.skills.length >= 5,
      href: '#skills',
    },
    {
      key: 'education',
      label: '',
      weight: 5,
      filled: profile.education.length > 0,
      href: '#education',
    },
    {
      key: 'targets',
      label: '',
      weight: 10,
      filled: profile.targetRoles.length > 0,
      href: '#targets',
    },
  ];
  const score = items.reduce((sum, item) => sum + (item.filled ? item.weight : 0), 0);
  return { score, items };
}

export default function ProfilePageClient({ profile }: { profile: ProfileData }) {
  const t = useTranslations('profile');
  const { score, items } = computeCompleteness(profile);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
      {/* Low completeness banner */}
      {score < 40 && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <span>⚠</span>
          <span>{t('completenessLow')}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <ProfileSidebar score={score} items={items} currentProfile={profile} />

        {/* Main content */}
        <main className="flex-1 space-y-4 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

          <PersonalInfoSection
            fullName={profile.fullName}
            email={profile.email}
            location={profile.location}
            linkedinUrl={profile.linkedinUrl}
            portfolioUrl={profile.portfolioUrl}
            narrative={profile.narrative}
          />

          <ExperienceSection experiences={profile.experiences} />
          <SkillsSection skills={profile.skills} />
          <EducationSection education={profile.education} />

          <CareerTargetsSection
            targetRoles={profile.targetRoles}
            salaryMin={profile.salaryMin}
            salaryMax={profile.salaryMax}
            remotePolicy={profile.remotePolicy}
          />
        </main>
      </div>
    </div>
  );
}
