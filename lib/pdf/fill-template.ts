import { readFileSync } from 'fs';
import { join } from 'path';
import type { Profile } from '@prisma/client';
import type { Locale } from '@/i18n/request';

const CV_SECTION_TITLES: Record<Locale, Record<string, string>> = {
  en: {
    summary: 'Professional Summary',
    competencies: 'Core Competencies',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    certifications: 'Certifications',
    skills: 'Technical Skills',
  },
  'pt-BR': {
    summary: 'Resumo Profissional',
    competencies: 'Competências Principais',
    experience: 'Experiência',
    projects: 'Projetos',
    education: 'Formação',
    certifications: 'Certificações',
    skills: 'Habilidades Técnicas',
  },
  es: {
    summary: 'Resumen Profesional',
    competencies: 'Competencias Principales',
    experience: 'Experiencia',
    projects: 'Proyectos',
    education: 'Formación',
    certifications: 'Certificaciones',
    skills: 'Habilidades Técnicas',
  },
};

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

export function fillTemplate(sections: ResumeSections, profile: Profile, language: Locale = 'en'): string {
  const titles = CV_SECTION_TITLES[language] ?? CV_SECTION_TITLES.en;
  const replacements: Record<string, string> = {
    '{{LANG}}': language,
    '{{PAGE_WIDTH}}': '8.5in',
    '{{NAME}}': profile.fullName,
    '{{EMAIL}}': profile.email,
    '{{LOCATION}}': profile.location,
    '{{LINKEDIN_DISPLAY}}': profile.linkedinUrl ? extractDomain(profile.linkedinUrl) : '',
    '{{PORTFOLIO_DISPLAY}}': profile.portfolioUrl ? extractDomain(profile.portfolioUrl) : '',
    '{{LINKEDIN_URL}}': profile.linkedinUrl ?? '',
    '{{PORTFOLIO_URL}}': profile.portfolioUrl ?? '',
    '{{SECTION_SUMMARY}}': titles.summary,
    '{{SECTION_COMPETENCIES}}': titles.competencies,
    '{{SECTION_EXPERIENCE}}': titles.experience,
    '{{SECTION_PROJECTS}}': titles.projects,
    '{{SECTION_EDUCATION}}': titles.education,
    '{{SECTION_CERTIFICATIONS}}': titles.certifications,
    '{{SECTION_SKILLS}}': titles.skills,
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
