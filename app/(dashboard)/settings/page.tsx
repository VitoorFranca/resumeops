import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import Link from 'next/link';

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });
  if (!dbUser) redirect('/sign-in');

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{dbUser.plan === 'PRO' ? 'Pro' : 'Free'}</p>
            <p className="text-sm text-gray-400">
              {dbUser.plan === 'PRO' ? 'Unlimited evaluations + resume generation' : '3 evaluations/month'}
            </p>
          </div>
          {dbUser.plan === 'FREE' && (
            <form action="/api/billing/checkout" method="POST">
              <button
                type="submit"
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700"
              >
                Upgrade to Pro
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold mb-2">Profile</h2>
        <p className="text-sm text-gray-500 mb-4">
          {dbUser.profile?.fullName ?? 'No profile yet'}
          {dbUser.profile?.email ? ` · ${dbUser.profile.email}` : ''}
        </p>
        <Link
          href="/onboarding"
          className="text-sm text-teal-600 hover:underline"
        >
          Edit profile →
        </Link>
      </div>
    </div>
  );
}
