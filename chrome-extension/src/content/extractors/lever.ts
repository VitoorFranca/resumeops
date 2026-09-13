import type { Extractor } from './index';
import type { JobExtraction } from '../../lib/types';
import { textFrom } from './index';

export class LeverExtractor implements Extractor {
  extract(): JobExtraction | null {
    const bodyEl =
      document.querySelector('.posting-page-content') ??
      document.querySelector('.section-wrapper') ??
      document.querySelector('main');

    const rawText = bodyEl?.textContent?.trim();
    if (!rawText || rawText.length < 80) return null;

    const title = textFrom('.posting-headline h2', 'h2.posting-title', 'h2', 'h1');

    const company =
      document.querySelector('.main-header-logo')?.getAttribute('alt') ??
      textFrom('.company-name') ??
      extractCompanyFromUrl(location.href);

    return { title, company, rawText, sourceUrl: location.href };
  }
}

function extractCompanyFromUrl(url: string): string | null {
  // https://jobs.lever.co/acme/abc-123 → "acme"
  const match = url.match(/jobs\.lever\.co\/([^/]+)/);
  return match ? match[1] : null;
}
