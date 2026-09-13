import type { Extractor } from './index';
import type { JobExtraction } from '../../lib/types';
import { textFrom } from './index';

export class GupyExtractor implements Extractor {
  extract(): JobExtraction | null {
    const bodyEl =
      document.querySelector('[data-testid="job-description"]') ??
      document.querySelector('[data-testid="job-details-section"]') ??
      document.querySelector('[data-testid="job-tab-content"]') ??
      document.querySelector('section[class*="JobDescription"]') ??
      document.querySelector('div[class*="job-description"]') ??
      document.querySelector('article') ??
      // Last resort: grab all visible text from main content area
      document.querySelector('main');

    const rawText = bodyEl?.textContent?.trim();
    if (!rawText || rawText.length < 80) return null;

    const title = textFrom(
      'h1[data-testid="job-name"]',
      'h1[data-testid="job-title"]',
      '[data-testid="job-name"]',
      'h1[class*="JobTitle"]',
      'h1',
    );

    const company =
      textFrom(
        '[data-testid="company-name"]',
        '[data-testid="company-title"]',
        'span[class*="CompanyName"]',
        '.company-name',
      ) ?? extractCompanyFromUrl(location.href);

    return { title, company, rawText, sourceUrl: location.href };
  }
}

function extractCompanyFromUrl(url: string): string | null {
  // https://acme.gupy.io/jobs/123 → "acme"
  const match = url.match(/https?:\/\/([^.]+)\.gupy\.io/);
  return match ? match[1] : null;
}
