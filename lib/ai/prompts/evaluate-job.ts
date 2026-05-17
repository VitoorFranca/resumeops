import { anthropic } from '../client';
import type { Profile } from '@prisma/client';

function safeParseJSON(text: string) {
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

function serializeProfile(profile: Profile): string {
  return [
    `Name: ${profile.fullName}`,
    `Location: ${profile.location}`,
    `Remote policy: ${profile.remotePolicy}`,
    profile.salaryMin ? `Salary target: $${profile.salaryMin.toLocaleString()}–$${profile.salaryMax?.toLocaleString() ?? '?'}` : '',
    `Target roles: ${profile.targetRoles}`,
    profile.narrative ? `Narrative: ${profile.narrative}` : '',
    '',
    '=== EXPERIENCES ===',
    JSON.stringify(profile.experiences, null, 2),
    '',
    '=== SKILLS ===',
    JSON.stringify(profile.skills, null, 2),
    '',
    '=== EDUCATION ===',
    JSON.stringify(profile.education, null, 2),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function evaluateJob(jobText: string, profile: Profile) {
  const profileBlock = serializeProfile(profile);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `You are a senior technical recruiter and career advisor. You evaluate job fit with precision.

RULES — NEVER BREAK THESE:
- ONLY reference experiences, skills, and projects that exist in the candidate profile
- If a metric (number, %, $) is not in the profile, do not use it
- If a technology is not in the profile, do not claim the candidate knows it
- Score 1-5 where: 5=exceptional fit, 4=good fit, 3=possible, 2=unlikely, 1=wrong fit
- Flag every hard-blocker requirement that is not met in the profile

SCORING WEIGHTS:
- scoreA (CV match): % of must-have requirements met × 5
- scoreB (archetype): 5 if primary target archetype, 3.5 if adjacent, 2 if off-target
- scoreC (comp): 5 if above target range, 3 if at range, 1 if undisclosed/unclear
- scoreD (culture/remote): 5 if matches remote policy, 3 if hybrid ok, 1 if must be onsite
- globalScore: (scoreA×0.40) + (scoreB×0.25) + (scoreC×0.20) + (scoreD×0.15)`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `=== CANDIDATE PROFILE (use ONLY data from here) ===\n${profileBlock}\n=== END PROFILE ===`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `=== JOB DESCRIPTION ===
${jobText}
=== END JD ===

Evaluate the candidate's fit for this role. Return JSON:
{
  "title": "job title",
  "company": "company name",
  "archetype": "AI_PLATFORM_LLMOPS|AGENTIC_AUTOMATION|TECHNICAL_AI_PM|AI_SOLUTIONS_ARCHITECT|AI_FORWARD_DEPLOYED|AI_TRANSFORMATION|BACKEND_ENGINEER|FRONTEND_ENGINEER|FULLSTACK_ENGINEER|DATA_ENGINEER|DEVOPS_SRE|PRODUCT_MANAGER|OTHER",
  "scoreA": 0.0,
  "scoreB": 0.0,
  "scoreC": 0.0,
  "scoreD": 0.0,
  "globalScore": 0.0,
  "scoreExplanations": {
    "A": "1-2 sentences on CV match with exact quotes from profile",
    "B": "1-2 sentences on archetype alignment",
    "C": "1-2 sentences on compensation alignment (state if data unavailable)",
    "D": "1-2 sentences on culture/remote fit"
  },
  "gaps": [
    {
      "requirement": "exact requirement text from JD",
      "isBlocker": true,
      "profileHas": "what the profile has (or null)",
      "mitigation": "1 sentence on how to address this gap"
    }
  ],
  "topChanges": [
    {
      "section": "summary|experience|skills",
      "proposed": "specific change to maximize match",
      "reason": "why this helps"
    }
  ],
  "legitimacy": "HIGH_CONFIDENCE|PROCEED_WITH_CAUTION|SUSPICIOUS",
  "legitimacyNotes": "1-2 sentences on any legitimacy concerns"
}

Return ONLY valid JSON.`,
          },
        ],
      },
    ],
  });

  return safeParseJSON(response.content[0].type === 'text' ? response.content[0].text : '{}');
}
