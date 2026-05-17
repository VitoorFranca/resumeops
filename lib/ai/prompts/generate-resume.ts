import { anthropic } from '../client';
import type { Profile } from '@prisma/client';
import { extractKeywords } from './extract-keywords';

function safeParseJSON(text: string) {
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

function serializeProfile(profile: Profile): string {
  return [
    `Name: ${profile.fullName}`,
    `Location: ${profile.location}`,
    `Email: ${profile.email}`,
    profile.linkedinUrl ? `LinkedIn: ${profile.linkedinUrl}` : '',
    profile.portfolioUrl ? `Portfolio: ${profile.portfolioUrl}` : '',
    profile.narrative ? `Narrative/Superpower: ${profile.narrative}` : '',
    '',
    '=== EXPERIENCES (source of truth for all achievements) ===',
    JSON.stringify(profile.experiences, null, 2),
    '',
    '=== SKILLS (only these skills exist) ===',
    JSON.stringify(profile.skills, null, 2),
    '',
    '=== EDUCATION ===',
    JSON.stringify(profile.education, null, 2),
  ]
    .filter(Boolean)
    .join('\n');
}

type MatchReport = {
  archetype: string;
  gaps: { requirement: string; isBlocker: boolean }[];
};

export async function generateResume(
  jobText: string,
  profile: Profile,
  matchReport: MatchReport,
): Promise<Record<string, string>> {
  const [keywords] = await Promise.all([extractKeywords(jobText)]);

  const profileBlock = serializeProfile(profile);
  const nonBlockerGaps = matchReport.gaps
    .filter(g => !g.isBlocker)
    .map(g => g.requirement)
    .join(', ');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are generating a tailored resume. You will be audited for accuracy.

ANTI-HALLUCINATION CONTRACT — MANDATORY:
- Every metric (number, %, $) must exist verbatim in the candidate profile
- Every technology must appear in the candidate profile skills or experience
- Every company, role, and date must match the profile exactly
- You MAY: reorder bullet points, rephrase using JD vocabulary, emphasize relevant aspects
- You MUST NOT: invent achievements, add numbers not in profile, add skills not in profile`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `=== CANDIDATE PROFILE (source of truth) ===\n${profileBlock}\n=== END PROFILE ===`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `=== JOB DESCRIPTION ===
${jobText}

ARCHETYPE: ${matchReport.archetype}
ATS KEYWORDS TO INCLUDE NATURALLY: ${keywords.join(', ')}
GAPS TO ADDRESS (where possible, without fabricating): ${nonBlockerGaps || 'none'}
=== END CONTEXT ===

Generate a complete tailored resume. Return JSON with HTML sections:

{
  "summary": "<p>3 sentences: identity + top proof point for this JD + forward-looking. Use 3-4 keywords naturally.</p>",
  "competencies": "<span class='competency-tag'>Keyword 1</span><span class='competency-tag'>Keyword 2</span>...",
  "experience": "<div class='job'>...</div>",
  "projects": "<div class='project'>...</div>",
  "skills": "<div class='skills-group'>...</div>",
  "education": "<div class='edu-item'>...</div>"
}

Experience rule: put most relevant roles FIRST. Rewrite bullets using JD vocabulary.
Skills rule: only include skills that appear in the JD or fill a gap. Order by JD relevance.

Return ONLY valid JSON.`,
          },
        ],
      },
    ],
  });

  return safeParseJSON(response.content[0].type === 'text' ? response.content[0].text : '{}');
}
