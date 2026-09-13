import type { JobExtraction } from '../lib/types';

const WIDGET_ID = 'resumeops-widget';

export function injectWidget(job: JobExtraction): void {
  if (document.getElementById(WIDGET_ID)) return;

  const btn = document.createElement('button');
  btn.id = WIDGET_ID;
  btn.innerHTML = `
    <span style="display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      Analyze Job
    </span>
  `;

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    background: '#111827',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    transition: 'transform 0.15s, opacity 0.15s',
    lineHeight: '1',
  });

  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.04)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });

  btn.addEventListener('click', () => {
    // Store job data keyed by URL so popup can find it
    chrome.storage.session.set({ [`job_url_${location.href}`]: job });
    // Signal background to set a badge hint
    chrome.runtime.sendMessage({ type: 'BADGE_HINT' });
    // Brief visual feedback
    btn.innerHTML = `<span style="display:flex;align-items:center;gap:6px">✓ Click the extension icon</span>`;
    setTimeout(() => {
      btn.innerHTML = `
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Analyze Job
        </span>
      `;
    }, 3000);
  });

  document.body.appendChild(btn);
}

export function removeWidget(): void {
  document.getElementById(WIDGET_ID)?.remove();
}
