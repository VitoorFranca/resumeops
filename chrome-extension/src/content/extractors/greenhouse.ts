import type { Extractor } from './index';
import type { JobExtraction } from '../../lib/types';
import { textFrom } from './index';

export class GreenhouseExtractor implements Extractor {
  extract(): JobExtraction | null {
    const bodyEl =
      document.querySelector('#content') ??
      document.querySelector('.job__description') ??
      document.querySelector('[data-testid="job-description"]') ??
      document.querySelector('main');

    const rawText = bodyEl?.textContent?.trim();
    if (!rawText || rawText.length < 80) return null;

    const title = textFrom(
      'h1.app-title',
      'h1[data-qa="job-title"]',
      '.job-post h1',
      'h1',
    );

    const company = textFrom(
      '.company-name',
      '[data-qa="company-name"]',
      '.logo-container img[alt]',
    ) ?? extractCompanyFromUrl(location.href);

    return { title, company, rawText, sourceUrl: location.href };
  }
}

function extractCompanyFromUrl(url: string): string | null {
  // https://boards.greenhouse.io/acmeinc/jobs/123 → "acmeinc"
  const match = url.match(/boards\.greenhouse\.io\/([^/]+)/);
  return match ? match[1] : null;
}
