import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  return Response.json(dbUser?.profile ?? null);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const profile = await db.profile.update({
    where: { userId: dbUser.id },
    data: {
      ...(body.language !== undefined && { language: body.language }),
    },
  });

  return Response.json(profile);
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const clerkUser = await currentUser();
  const body = await req.json();

  // Ensure user exists
  const dbUser = await db.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
    },
    update: {},
  });

  const profile = await db.profile.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      fullName: body.fullName ?? clerkUser?.fullName ?? '',
      email: body.email ?? clerkUser?.emailAddresses[0]?.emailAddress ?? '',
      location: body.location ?? '',
      linkedinUrl: body.linkedinUrl ?? null,
      portfolioUrl: body.portfolioUrl ?? null,
      experiences: body.experiences ?? [],
      skills: body.skills ?? [],
      education: body.education ?? [],
      cvRaw: body.cvRaw ?? null,
      narrative: body.narrative ?? null,
      targetRoles: JSON.stringify(body.targetRoles ?? []),
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      remotePolicy: body.remotePolicy ?? 'REMOTE_OK',
    },
    update: {
      fullName: body.fullName ?? clerkUser?.fullName ?? undefined,
      email: body.email ?? undefined,
      location: body.location ?? undefined,
      linkedinUrl: body.linkedinUrl,
      portfolioUrl: body.portfolioUrl,
      experiences: body.experiences ?? undefined,
      skills: body.skills ?? undefined,
      education: body.education ?? undefined,
      cvRaw: body.cvRaw,
      narrative: body.narrative,
      targetRoles: body.targetRoles ? JSON.stringify(body.targetRoles) : undefined,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      remotePolicy: body.remotePolicy ?? undefined,
    },
  });

  return Response.json(profile);
}
