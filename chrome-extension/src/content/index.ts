import { getExtractor } from './extractors';
import { injectWidget, removeWidget } from './widget';
import type { JobExtraction } from '../lib/types';

let lastHref = location.href;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function tryExtract(): boolean {
  const extractor = getExtractor(location.href);
  if (!extractor) return false;

  const job = extractor.extract();
  if (!job) return false;

  sendJobFound(job);
  injectWidget(job);
  return true;
}

function sendJobFound(job: JobExtraction): void {
  chrome.runtime.sendMessage({ type: 'JOB_FOUND', payload: job });
}

function startLinkedInPoll(): void {
  if (pollTimer) clearInterval(pollTimer);
  let attempts = 0;
  pollTimer = setInterval(() => {
    attempts++;
    if (tryExtract() || attempts >= 15) {
      clearInterval(pollTimer!);
      pollTimer = null;
    }
  }, 400);
}

// Initial run on page load
if (location.href.includes('linkedin.com/jobs/view')) {
  // LinkedIn lazy-loads — poll until ready
  startLinkedInPoll();
} else {
  tryExtract();
}

// SPA navigation detection
const observer = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    removeWidget();

    // Re-check after a short delay for SPA to settle
    setTimeout(() => {
      if (location.href.includes('linkedin.com/jobs/view')) {
        startLinkedInPoll();
      } else {
        tryExtract();
      }
    }, 800);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
