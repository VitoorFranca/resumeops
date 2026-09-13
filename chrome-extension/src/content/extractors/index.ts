import type { JobExtraction } from '../../lib/types';
import { LinkedInExtractor } from './linkedin';
import { GupyExtractor } from './gupy';
import { GreenhouseExtractor } from './greenhouse';
import { LeverExtractor } from './lever';
import { AshbyExtractor } from './ashby';

export interface Extractor {
  extract(): JobExtraction | null;
}

export function getExtractor(url: string): Extractor | null {
  if (url.includes('linkedin.com/jobs')) return new LinkedInExtractor();
  // Gupy: matches both /job/ (singular) and /jobs/ (plural)
  if (url.includes('.gupy.io')) return new GupyExtractor();
  if (url.includes('boards.greenhouse.io') && url.includes('/jobs/')) return new GreenhouseExtractor();
  if (url.includes('jobs.lever.co')) return new LeverExtractor();
  if (url.includes('jobs.ashbyhq.com')) return new AshbyExtractor();
  return null;
}

export function textFrom(...selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 10) return text;
  }
  return null;
}
