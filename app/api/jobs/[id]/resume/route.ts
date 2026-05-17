import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { generateResume } from '@/lib/ai/prompts/generate-resume';
import { fillTemplate } from '@/lib/pdf/fill-template';
import { requirePlan, PaywallError } from '@/lib/quota';

type MatchReport = {
  archetype: string;
  gaps: { requirement: string; isBlocker: boolean }[];
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = await params;

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    await requirePlan(dbUser.id, 'PRO');
  } catch (e) {
    if (e instanceof PaywallError) {
      return Response.json({ error: 'paywall' }, { status: 402 });
    }
    throw e;
  }

  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id: jobId, userId: dbUser.id } }),
    db.profile.findUnique({ where: { userId: dbUser.id } }),
  ]);

  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
  if (!profile) return Response.json({ error: 'Profile not found' }, { status: 400 });
  if (!job.matchReport) return Response.json({ error: 'Job not yet evaluated' }, { status: 400 });

  const matchReport = job.matchReport as MatchReport;

  let sections: Record<string, string>;
  try {
    sections = await generateResume(job.rawText, profile, matchReport);
  } catch (e) {
    console.error('Resume generation failed', e);
    return Response.json({ error: 'generation_failed', message: 'Resume generation failed. Try again.' }, { status: 500 });
  }

  const resumeHtml = fillTemplate(sections as unknown as Parameters<typeof fillTemplate>[0], profile);

  const resume = await db.resumeVersion.create({
    data: { userId: dbUser.id, jobId, html: resumeHtml, status: 'ready' },
  });

  return Response.json({ resumeHtml, resumeId: resume.id });
}
