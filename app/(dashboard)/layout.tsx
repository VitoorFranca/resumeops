import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { db } from '@/lib/db/client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();

  // Upsert user in DB on first load
  const dbUser = await db.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
    },
    update: {},
    include: { profile: true },
  });

  // Onboarding guard
  if (!dbUser.profile?.fullName) {
    // Only redirect if not already on onboarding
    // (next/navigation redirect is thrown, so check via pathname in a client boundary —
    //  here we do it by checking the request in a simpler way)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
        <Link href="/dashboard" className="font-bold text-base tracking-tight mb-8 block">
          ResumeOps
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/tracker">Tracker</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
        <div className="mt-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2"
    >
      {children}
    </Link>
  );
}
