import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import JobInput from '@/components/jobs/JobInput';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      profile: true,
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, company: true, matchScore: true, status: true, createdAt: true },
      },
    },
  });

  if (!dbUser?.profile?.fullName) redirect('/onboarding');

  const freeLimit = 3;
  const usedThisMonth = dbUser.jobs.filter(j => {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    return new Date(j.createdAt) >= start;
  }).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Evaluate a job</h1>
        {dbUser.plan === 'FREE' && (
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {usedThisMonth}/{freeLimit} free evaluations used
          </span>
        )}
      </div>

      <JobInput />

      {dbUser.jobs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent evaluations</h2>
          <div className="space-y-2">
            {dbUser.jobs.map(job => (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{job.title ?? 'Untitled role'}</p>
                  <p className="text-xs text-gray-400">{job.company ?? '—'}</p>
                </div>
                {job.matchScore != null && (
                  <span className={`text-sm font-bold ${job.matchScore >= 4 ? 'text-teal-600' : job.matchScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                    {job.matchScore.toFixed(1)}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
