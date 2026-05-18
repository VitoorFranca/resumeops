import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import ProfilePageClient from '@/components/profile/ProfilePageClient';
import type { ProfileData } from '@/lib/types/profile';

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!dbUser?.profile?.fullName) redirect('/onboarding');

  const p = dbUser.profile;

  const profile: ProfileData = {
    fullName: p.fullName,
    email: p.email,
    location: p.location,
    linkedinUrl: p.linkedinUrl ?? null,
    portfolioUrl: p.portfolioUrl ?? null,
    narrative: p.narrative ?? null,
    experiences: (p.experiences as ProfileData['experiences']) ?? [],
    skills: (p.skills as ProfileData['skills']) ?? [],
    education: (p.education as ProfileData['education']) ?? [],
    targetRoles: JSON.parse(p.targetRoles ?? '[]') as string[],
    salaryMin: p.salaryMin ?? null,
    salaryMax: p.salaryMax ?? null,
    remotePolicy: (p.remotePolicy as ProfileData['remotePolicy']) ?? 'REMOTE_OK',
    language: p.language ?? 'en',
  };

  return <ProfilePageClient profile={profile} />;
}
