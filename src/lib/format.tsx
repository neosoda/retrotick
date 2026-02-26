import { type ComponentChildren } from 'preact';

export function formatMnemonic(text: string): ComponentChildren {
  const parts: ComponentChildren[] = [];
  let key = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '&') {
      if (i + 1 < text.length) {
        const next = text[i + 1];
        if (next === '&') {
          parts.push('&');
          i++;
        } else {
          parts.push(<u key={key++}>{next}</u>);
          i++;
        }
      } else {
        parts.push('&');
      }
    } else {
      parts.push(ch);
    }
  }
  // Merge adjacent strings
  const merged: ComponentChildren[] = [];
  let buf = '';
  for (const p of parts) {
    if (typeof p === 'string') {
      buf += p;
    } else {
      if (buf) { merged.push(buf); buf = ''; }
      merged.push(p);
    }
  }
  if (buf) merged.push(buf);
  if (merged.length === 1) return merged[0];
  return <>{merged}</>;
}
