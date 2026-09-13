import type { Extractor } from './index';
import type { JobExtraction } from '../../lib/types';
import { textFrom } from './index';

export class AshbyExtractor implements Extractor {
  extract(): JobExtraction | null {
    const bodyEl =
      document.querySelector('.ashby-job-posting-brief-description') ??
      document.querySelector('[data-test="job-description"]') ??
      document.querySelector('div.jobDetails') ??
      document.querySelector('main');

    const rawText = bodyEl?.textContent?.trim();
    if (!rawText || rawText.length < 80) return null;

    const title = textFrom(
      'h1.ashby-job-posting-heading',
      'h1[data-test="job-title"]',
      'h1',
    );

    // jobs.ashbyhq.com/company-slug/job-id
    const company =
      textFrom('[data-test="company-name"]', '.company-name') ??
      extractCompanyFromUrl(location.href);

    return { title, company, rawText, sourceUrl: location.href };
  }
}

function extractCompanyFromUrl(url: string): string | null {
  const match = url.match(/jobs\.ashbyhq\.com\/([^/]+)/);
  return match ? match[1] : null;
}
