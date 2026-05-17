import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const clerkUser = await currentUser();
  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const session = await createCheckoutSession(
    dbUser.id,
    clerkUser?.emailAddresses[0]?.emailAddress ?? '',
  );

  return Response.json({ url: session.url });
}
