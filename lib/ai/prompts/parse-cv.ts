import { anthropic } from '../client';

function safeParseJSON(text: string) {
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function parseCV(cvText: string) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Parse this CV into structured JSON. Extract all experience exactly as written — do not rephrase, add, or infer anything not explicitly stated.

CV TEXT:
${cvText}

Return this exact JSON structure:
{
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null",
      "bullets": ["exact text from CV"],
      "skillsUsed": ["extracted skills mentioned in this role"]
    }
  ],
  "skills": [
    { "name": "string", "category": "language|framework|cloud|database|ai_ml|devops|soft|domain", "level": "basic|intermediate|advanced|expert" }
  ],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "summary": "existing summary if present, else null"
}

CRITICAL: Only output valid JSON. No explanation text.`,
      },
    ],
  });

  return safeParseJSON(response.content[0].type === 'text' ? response.content[0].text : '{}');
}
