import { anthropic } from '../client';

function safeParseJSON(text: string): string[] {
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function extractKeywords(jobText: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Extract 12-18 ATS keywords from this job description.

Rules:
- Noun phrases only (e.g., "RAG pipelines", "stakeholder management")
- Include technical terms, methodologies, and key soft skills
- Exclude generic phrases ("strong communication", "self-starter")
- Order by importance to the role

Return JSON array of strings only. No explanation.

JD:
${jobText.slice(0, 3000)}`,
      },
    ],
  });

  return safeParseJSON(response.content[0].type === 'text' ? response.content[0].text : '[]');
}
