import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import KanbanBoard from '@/components/tracker/KanbanBoard';
import { getTranslations } from 'next-intl/server';

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

  const t = await getTranslations('applications');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 shrink-0">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      {applications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>{t('empty')}</p>
          <a href="/dashboard" className="text-sm text-teal-600 hover:underline mt-2 block">
            {t('emptyLink')}
          </a>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard applications={applications} />
        </div>
      )}
    </div>
  );
}
