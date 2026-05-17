// Ported verbatim from career-ops/generate-pdf.mjs:34-75
// Only touches body text — preserves CSS, JS, tag attributes, and URLs.
export function normalizeTextForATS(html: string): { html: string; replacements: Record<string, number> } {
  const replacements: Record<string, number> = {};
  const bump = (key: string, n: number) => {
    replacements[key] = (replacements[key] ?? 0) + n;
  };

  const masks: string[] = [];
  const masked = html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, match => {
    const token = `\x00MASK${masks.length}\x00`;
    masks.push(match);
    return token;
  });

  let out = '';
  let i = 0;
  while (i < masked.length) {
    const lt = masked.indexOf('<', i);
    if (lt === -1) {
      out += sanitizeText(masked.slice(i));
      break;
    }
    out += sanitizeText(masked.slice(i, lt));
    const gt = masked.indexOf('>', lt);
    if (gt === -1) {
      out += masked.slice(lt);
      break;
    }
    out += masked.slice(lt, gt + 1);
    i = gt + 1;
  }

  const restored = out.replace(/\x00MASK(\d+)\x00/g, (_, n: string) => masks[Number(n)]);
  return { html: restored, replacements };

  function sanitizeText(text: string): string {
    if (!text) return text;
    let t = text;
    t = t.replace(/—/g, () => { bump('em-dash', 1); return '-'; });
    t = t.replace(/–/g, () => { bump('en-dash', 1); return '-'; });
    t = t.replace(/[“”„‟]/g, () => { bump('smart-double-quote', 1); return '"'; });
    t = t.replace(/[‘’‚‛]/g, () => { bump('smart-single-quote', 1); return "'"; });
    t = t.replace(/…/g, () => { bump('ellipsis', 1); return '...'; });
    t = t.replace(/[​‌‍⁠﻿]/g, () => { bump('zero-width', 1); return ''; });
    t = t.replace(/ /g, () => { bump('nbsp', 1); return ' '; });
    return t;
  }
}
