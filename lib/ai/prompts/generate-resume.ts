import { anthropic } from '../client';
import type { Profile } from '@prisma/client';
import { extractKeywords } from './extract-keywords';
import type { Locale } from '@/i18n/request';

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Brazilian Portuguese',
  es: 'Spanish',
};

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

export type ResumeMeta = {
  injectedKeywords: string[];
  featuredRoles: string[];
  omittedRoles: string[];
};

export async function generateResume(
  jobText: string,
  profile: Profile,
  matchReport: MatchReport,
  language: Locale = 'en',
): Promise<{ sections: Record<string, string>; meta: ResumeMeta }> {
  const [keywords] = await Promise.all([extractKeywords(jobText)]);
  const languageName = LANGUAGE_NAMES[language];

  const profileBlock = serializeProfile(profile);
  const nonBlockerGaps = matchReport.gaps
    .filter(g => !g.isBlocker)
    .map(g => g.requirement)
    .join(', ');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You are an ATS optimization expert and technical recruiter. Your task: rewrite this resume to maximize interview chances for THIS SPECIFIC JOB. You will be audited for accuracy.

LANGUAGE: Write all resume content in ${languageName}. Every sentence, phrase, and word in the output must be in ${languageName}.

STRATEGY RULES — MANDATORY:
- Max 1–2 pages: cut irrelevant bullets; omit roles with no JD relevance
- Remove redundancy: each bullet must add new information — never repeat the same idea
- Prioritize relevant experience: put the most JD-aligned roles and bullets first
- Inject job-specific keywords naturally — never force or repeat awkwardly
- Bullet format: action verb + measurable impact (use real numbers from profile only)
- Optimize for 6–10 second scan: strongest signal in first 3 bullets of each role
- Do NOT write a generic summary — every sentence must reference the target job

ANTI-HALLUCINATION CONTRACT — MANDATORY:
- Every metric (number, %, $) must exist verbatim in the candidate profile
- Every technology must appear in the candidate profile skills or experience
- Every company, role, and date must match the profile exactly
- You MAY: reorder bullet points, rephrase using JD vocabulary, emphasize relevant aspects, OMIT irrelevant bullets
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

Generate a complete tailored resume. Return JSON with HTML sections plus metadata:

{
  "summary": "<p>3 sentences: identity + top proof point for this JD + forward-looking. Use 3-4 keywords naturally. Do NOT be generic.</p>",
  "competencies": "<span class='competency-tag'>Keyword 1</span><span class='competency-tag'>Keyword 2</span>...",
  "experience": "<div class='job'>...</div>",
  "projects": "<div class='project'>...</div>",
  "skills": "<div class='skills-group'>...</div>",
  "education": "<div class='edu-item'>...</div>",
  "_meta": {
    "injectedKeywords": ["keyword1", "keyword2"],
    "featuredRoles": ["Company A — Role X", "Company B — Role Y"],
    "omittedRoles": ["Company C — Role Z"]
  }
}

Experience rule: put most relevant roles FIRST. Rewrite bullets using JD vocabulary. Cut roles with zero JD relevance.
Skills rule: only include skills that appear in the JD or fill a gap. Order by JD relevance.
_meta rule: list every ATS keyword you actually used, every role you featured prominently, and every role you omitted or heavily cut.

Return ONLY valid JSON.`,
          },
        ],
      },
    ],
  });

  const parsed = safeParseJSON(response.content[0].type === 'text' ? response.content[0].text : '{}');
  const { _meta, ...sections } = parsed;
  const meta: ResumeMeta = _meta ?? { injectedKeywords: [], featuredRoles: [], omittedRoles: [] };
  return { sections, meta };
}
