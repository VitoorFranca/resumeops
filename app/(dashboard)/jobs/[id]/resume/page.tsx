import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import ResumeGenerator from '@/components/jobs/ResumeGenerator';

export default async function ResumePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });
  if (!dbUser) redirect('/sign-in');

  const defaultLanguage = dbUser.profile?.language ?? 'en';

  return <ResumeGenerator defaultLanguage={defaultLanguage} />;
}
