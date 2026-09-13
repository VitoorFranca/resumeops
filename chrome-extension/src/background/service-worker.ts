import { storeJobForTab } from '../lib/storage';
import type { MessageToBackground } from '../lib/types';

chrome.runtime.onMessage.addListener(
  (msg: MessageToBackground, sender, sendResponse) => {
    if (msg.type === 'JOB_FOUND') {
      const tabId = sender.tab?.id;
      if (!tabId) return;
      storeJobForTab(tabId, msg.payload).then(() => {
        chrome.action.setBadgeText({ text: '✓', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#14b8a6', tabId });
      });
      return;
    }

    if (msg.type === 'BADGE_HINT') {
      const tabId = sender.tab?.id;
      if (!tabId) return;
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId });
      return;
    }

    // GET_JOB is no longer routed through the SW — popup reads storage directly.
    // Keeping the handler as a no-op so old widget messages don't throw.
    if (msg.type === 'GET_JOB') {
      sendResponse(null);
    }
  },
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
