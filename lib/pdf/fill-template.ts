import { readFileSync } from 'fs';
import { join } from 'path';
import type { Profile } from '@prisma/client';

// Loaded once at module init — template doesn't change at runtime
const templateHtml = readFileSync(join(process.cwd(), 'templates/cv-template.html'), 'utf-8');

// Font files embedded as base64 so Browserless.io can render them (no file:// access)
function loadFontBase64(filename: string): string {
  const fontPath = join(process.cwd(), 'public', 'fonts', filename);
  return readFileSync(fontPath).toString('base64');
}

function embedFonts(html: string): string {
  const fonts: Record<string, string> = {
    'space-grotesk-latin.woff2': loadFontBase64('space-grotesk-latin.woff2'),
    'space-grotesk-latin-ext.woff2': loadFontBase64('space-grotesk-latin-ext.woff2'),
    'dm-sans-latin.woff2': loadFontBase64('dm-sans-latin.woff2'),
    'dm-sans-latin-ext.woff2': loadFontBase64('dm-sans-latin-ext.woff2'),
  };

  let result = html;
  for (const [filename, b64] of Object.entries(fonts)) {
    // Replace relative path references with data URIs
    result = result.replaceAll(
      `url('./fonts/${filename}')`,
      `url('data:font/woff2;base64,${b64}')`,
    );
  }
  return result;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export interface ResumeSections {
  summary: string;
  competencies: string;
  experience: string;
  projects?: string;
  skills: string;
  education: string;
}

export function fillTemplate(sections: ResumeSections, profile: Profile): string {
  const replacements: Record<string, string> = {
    '{{LANG}}': 'en',
    '{{PAGE_WIDTH}}': '8.5in',
    '{{NAME}}': profile.fullName,
    '{{EMAIL}}': profile.email,
    '{{LOCATION}}': profile.location,
    '{{LINKEDIN_DISPLAY}}': profile.linkedinUrl ? extractDomain(profile.linkedinUrl) : '',
    '{{PORTFOLIO_DISPLAY}}': profile.portfolioUrl ? extractDomain(profile.portfolioUrl) : '',
    '{{LINKEDIN_URL}}': profile.linkedinUrl ?? '',
    '{{PORTFOLIO_URL}}': profile.portfolioUrl ?? '',
    '{{SECTION_SUMMARY}}': 'Professional Summary',
    '{{SECTION_COMPETENCIES}}': 'Core Competencies',
    '{{SECTION_EXPERIENCE}}': 'Experience',
    '{{SECTION_PROJECTS}}': 'Projects',
    '{{SECTION_EDUCATION}}': 'Education',
    '{{SECTION_CERTIFICATIONS}}': 'Certifications',
    '{{SECTION_SKILLS}}': 'Technical Skills',
    '{{SUMMARY_TEXT}}': sections.summary,
    '{{COMPETENCIES}}': sections.competencies,
    '{{EXPERIENCE}}': sections.experience,
    '{{PROJECTS}}': sections.projects ?? '',
    '{{SKILLS}}': sections.skills,
    '{{EDUCATION}}': sections.education,
    '{{CERTIFICATIONS}}': '',
  };

  let html = templateHtml;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return embedFonts(html);
}
