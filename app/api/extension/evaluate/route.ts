import { verifyToken } from '@clerk/backend';
import { db } from '@/lib/db/client';
import { evaluateJob } from '@/lib/ai/prompts/evaluate-job';
import { enforceQuota, QuotaError } from '@/lib/quota';
import type { Locale } from '@/i18n/request';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  let clerkId: string;
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    clerkId = payload.sub;
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const { rawText } = body as { rawText?: string };

  if (!rawText || rawText.trim().length < 100) {
    return Response.json(
      { error: 'rawText too short — paste the full job description' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) {
    return Response.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
  }

  try {
    await enforceQuota(dbUser.id, 'evaluations');
  } catch (e) {
    if (e instanceof QuotaError) {
      return Response.json(
        { error: 'quota_exceeded', limit: e.limit, plan: e.plan },
        { status: 402, headers: CORS_HEADERS },
      );
    }
    throw e;
  }

  const job = await db.job.create({
    data: { userId: dbUser.id, rawText: rawText.trim(), url: null, status: 'pending' },
  });

  const profile = await db.profile.findUnique({ where: { userId: dbUser.id } });
  if (!profile) {
    return Response.json(
      { error: 'profile_not_found', message: 'Complete your profile first' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  let result: Record<string, unknown>;
  try {
    result = await withRetry(() =>
      evaluateJob(job.rawText, profile, (profile.language as Locale) ?? 'en'),
    );
  } catch (e) {
    console.error('[extension/evaluate] AI evaluation failed', e);
    return Response.json(
      { error: 'evaluation_failed', message: 'AI evaluation failed. Try again.' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  await db.job.update({
    where: { id: job.id },
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
    where: { jobId: job.id },
    create: { userId: dbUser.id, jobId: job.id, status: 'Evaluated' },
    update: {},
  });

  return Response.json({ jobId: job.id, ...result }, { headers: CORS_HEADERS });
}

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
