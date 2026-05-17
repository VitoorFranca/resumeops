import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, rawText } = await req.json();
  if (!url && !rawText) return Response.json({ error: 'url or rawText required' }, { status: 400 });

  // LinkedIn URLs require login — prompt paste instead
  if (url?.includes('linkedin.com/jobs')) {
    return Response.json(
      { error: 'linkedin_url', message: 'LinkedIn URLs require login. Paste the job description text instead.' },
      { status: 400 },
    );
  }

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  let text = rawText;
  if (url) {
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(15000),
      });
      if (!jinaRes.ok) throw new Error(`Jina returned ${jinaRes.status}`);
      text = await jinaRes.text();
    } catch (e) {
      console.error('Jina fetch failed', e);
      return Response.json(
        { error: 'fetch_failed', message: "Couldn't fetch that URL. Paste the job description text instead." },
        { status: 400 },
      );
    }
  }

  const job = await db.job.create({
    data: { userId: dbUser.id, rawText: text, url: url ?? null, status: 'pending' },
  });

  return Response.json({ jobId: job.id });
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json([]);

  const jobs = await db.job.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return Response.json(jobs);
}
