import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import LanguageSelect from '@/components/settings/LanguageSelect';

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });
  if (!dbUser) redirect('/sign-in');

  const t = await getTranslations('settings');

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">{t('planSection')}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{dbUser.plan === 'PRO' ? t('planPro') : t('planFree')}</p>
            <p className="text-sm text-gray-400">
              {dbUser.plan === 'PRO' ? t('planProDesc') : t('planFreeDesc')}
            </p>
          </div>
          {dbUser.plan === 'FREE' && (
            <form action="/api/billing/checkout" method="POST">
              <button
                type="submit"
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700"
              >
                {t('upgradePro')}
              </button>
            </form>
          )}
        </div>
      </div>

      <LanguageSelect currentLanguage={dbUser.profile?.language ?? 'en'} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold mb-2">{t('profileSection')}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {dbUser.profile?.fullName ?? t('noProfile')}
          {dbUser.profile?.email ? ` · ${dbUser.profile.email}` : ''}
        </p>
        <Link
          href="/onboarding"
          className="text-sm text-teal-600 hover:underline"
        >
          {t('editProfile')}
        </Link>
      </div>
    </div>
  );
}
