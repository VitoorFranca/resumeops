import type { Extractor } from './index';
import type { JobExtraction } from '../../lib/types';
import { textFrom } from './index';

export class LinkedInExtractor implements Extractor {
  extract(): JobExtraction | null {
    // #job-details is the most stable selector as of 2024
    const bodyEl =
      document.querySelector('#job-details') ??
      document.querySelector('.jobs-description__content') ??
      document.querySelector('.jobs-description-content__text') ??
      document.querySelector('.jobs-box__html-content') ??
      document.querySelector('[data-test="job-description"]');

    const rawText = bodyEl?.textContent?.trim();
    if (!rawText || rawText.length < 80) return null;

    const title = textFrom(
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      '.t-24.t-bold.inline',
      'h1.t-24',
      'h1',
    );

    const company = textFrom(
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '[data-test="company-name"]',
    );

    return { title, company, rawText, sourceUrl: location.href };
  }
}
