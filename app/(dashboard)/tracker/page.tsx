import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import ApplicationTable from '@/components/tracker/ApplicationTable';

export default async function TrackerPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) redirect('/sign-in');

  const applications = await db.application.findMany({
    where: { userId: dbUser.id },
    include: { job: { select: { title: true, company: true, matchScore: true, url: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Application tracker</h1>
      {applications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No applications yet.</p>
          <a href="/dashboard" className="text-sm text-teal-600 hover:underline mt-2 block">
            Evaluate your first job →
          </a>
        </div>
      ) : (
        <ApplicationTable applications={applications} />
      )}
    </div>
  );
}
