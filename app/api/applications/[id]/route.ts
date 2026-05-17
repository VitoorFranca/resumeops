import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status, notes } = await req.json();

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const app = await db.application.update({
    where: { id, userId: dbUser.id },
    data: {
      status: status ?? undefined,
      notes: notes ?? undefined,
      appliedAt: status === 'Applied' ? new Date() : undefined,
    },
  });

  return Response.json(app);
}
