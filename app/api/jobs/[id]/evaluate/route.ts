import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { evaluateJob } from '@/lib/ai/prompts/evaluate-job';
import { enforceQuota, QuotaError } from '@/lib/quota';

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = await params;

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    await enforceQuota(dbUser.id, 'evaluations');
  } catch (e) {
    if (e instanceof QuotaError) {
      return Response.json({ error: 'quota_exceeded', limit: e.limit, plan: e.plan }, { status: 402 });
    }
    throw e;
  }

  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id: jobId, userId: dbUser.id } }),
    db.profile.findUnique({ where: { userId: dbUser.id } }),
  ]);

  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
  if (!profile) return Response.json({ error: 'Profile not found — complete onboarding first' }, { status: 400 });

  let result: Record<string, unknown>;
  try {
    result = await withRetry(() => evaluateJob(job.rawText, profile, (profile.language as import('@/i18n/request').Locale) ?? 'en'));
  } catch (e) {
    console.error('Evaluation failed', e);
    return Response.json({ error: 'evaluation_failed', message: 'AI evaluation failed. Try again.' }, { status: 500 });
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      status: 'matched',
      matchScore: result.globalScore as number,
      matchReport: result as Parameters<typeof db.job.update>[0]['data']['matchReport'],
      archetype: result.archetype as string,
      title: result.title as string,
      company: result.company as string,
    },
  });

  await db.application.upsert({
    where: { jobId },
    create: { userId: dbUser.id, jobId, status: 'Evaluated' },
    update: {},
  });

  return Response.json(result);
}
