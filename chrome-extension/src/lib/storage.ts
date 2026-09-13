import type { JobExtraction } from './types';

const JOB_KEY_PREFIX = 'job_tab_';

export async function storeJobForTab(tabId: number, job: JobExtraction): Promise<void> {
  await chrome.storage.session.set({ [`${JOB_KEY_PREFIX}${tabId}`]: job });
}

export async function getJobForTab(tabId: number): Promise<JobExtraction | null> {
  const result = await chrome.storage.session.get(`${JOB_KEY_PREFIX}${tabId}`);
  return (result[`${JOB_KEY_PREFIX}${tabId}`] as JobExtraction) ?? null;
}

/**
 * Called from popup — uses lastFocusedWindow to get the browser tab (not the popup's window).
 */
export async function getJobFromActiveTab(): Promise<JobExtraction | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabId = tabs[0]?.id;
  if (!tabId) return null;
  return getJobForTab(tabId);
}

/**
 * Fallback: inject a script directly into the active tab and extract text on the spot.
 * Used when the content script missed the page (wrong URL, slow load, etc.).
 */
export async function extractFromActiveTabDirectly(): Promise<JobExtraction | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab?.id || !tab.url) return null;

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJobPage,
    });
    const job = result?.result as JobExtraction | null;
    // Cache it so subsequent opens don't re-inject
    if (job) await storeJobForTab(tab.id, job);
    return job;
  } catch {
    return null;
  }
}

/**
 * Injected into the page — must be self-contained (no imports).
 */
function scrapeJobPage(): JobExtraction | null {
  const url = location.href;

  // Ordered from most specific to broadest
  const descSelectors = [
    '#job-details',                          // LinkedIn 2024
    '[data-testid="job-description"]',       // Gupy
    '[data-testid="job-details-section"]',   // Gupy alt
    '.jobs-description__content',           // LinkedIn fallback
    '.jobs-description-content__text',      // LinkedIn old
    '.job__description',                     // Greenhouse
    '.posting-page-content',                // Lever
    '.ashby-job-posting-brief-description', // Ashby
    'article',
    '[role="main"]',
    'main',
  ];

  let rawText = '';
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    const text = (el as HTMLElement | null)?.innerText?.trim() ?? '';
    if (text.length > rawText.length) rawText = text;
  }

  if (rawText.length < 80) return null;

  const title = (
    document.querySelector('h1') as HTMLElement | null
  )?.innerText?.trim() ?? null;

  // Try to infer company from common elements
  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name a',
    '[data-testid="company-name"]',
    '.posting-headline .sort-by-time',
  ];
  let company: string | null = null;
  for (const sel of companySelectors) {
    const text = (document.querySelector(sel) as HTMLElement | null)?.innerText?.trim();
    if (text) { company = text; break; }
  }

  return { title, company, rawText, sourceUrl: url };
}
