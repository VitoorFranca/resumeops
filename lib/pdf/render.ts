export async function renderPDF(html: string): Promise<Buffer> {
  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) throw new Error('BROWSERLESS_TOKEN not set');

  const response = await fetch(`https://chrome.browserless.io/pdf?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html,
      options: {
        format: 'Letter',
        margin: { top: '0.6in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
        printBackground: true,
      },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(`PDF render failed: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
