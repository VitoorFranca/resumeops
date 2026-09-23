import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { applicationPatchSchema } from '@/lib/validation/application';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const parsed = applicationPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'invalid_body', issues: parsed.error.flatten() }, { status: 400 });
  }
  const { status, notes } = parsed.data;

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
