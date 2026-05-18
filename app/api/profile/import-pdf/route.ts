import { auth } from '@clerk/nextjs/server';
import { parseCV } from '@/lib/ai/prompts/parse-cv';

// Use the internal lib path to avoid pdf-parse reading its own test files on import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  buffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const contentType = file.type;
  if (contentType && contentType !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await pdfParse(buffer);

    if (!text.trim()) return Response.json({ error: 'Could not extract text from PDF' }, { status: 422 });

    const parsed = await parseCV(text);
    return Response.json(parsed);
  } catch (err) {
    console.error('[import-pdf] error:', err);
    return Response.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
