import { auth } from '@clerk/nextjs/server';
import { parseCV } from '@/lib/ai/prompts/parse-cv';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { cvText } = await req.json();
  if (!cvText?.trim()) return Response.json({ error: 'cvText required' }, { status: 400 });

  try {
    const parsed = await parseCV(cvText);
    return Response.json(parsed);
  } catch (e) {
    console.error('CV parse error', e);
    return Response.json({ error: 'Parse failed' }, { status: 500 });
  }
}
