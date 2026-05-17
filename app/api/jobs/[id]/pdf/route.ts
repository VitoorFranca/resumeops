import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { normalizeTextForATS } from '@/lib/pdf/normalize-ats';
import { renderPDF } from '@/lib/pdf/render';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = await params;
  const { resumeId } = await req.json();

  const dbUser = await db.user.findUnique({ where: { clerkId } });
  if (!dbUser) return Response.json({ error: 'User not found' }, { status: 404 });

  const resume = await db.resumeVersion.findUnique({
    where: { id: resumeId, userId: dbUser.id, jobId },
  });
  if (!resume) return Response.json({ error: 'Resume not found' }, { status: 404 });

  const { html: normalizedHtml } = normalizeTextForATS(resume.html);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderPDF(normalizedHtml);
  } catch (e) {
    console.error('PDF render failed', e);
    // Fallback: return HTML as download
    return Response.json({
      error: 'pdf_timeout',
      message: 'PDF generation timed out. Downloading as HTML instead.',
      htmlFallback: normalizedHtml,
    }, { status: 500 });
  }

  return Response.json({ pdfBase64: pdfBuffer.toString('base64') });
}
