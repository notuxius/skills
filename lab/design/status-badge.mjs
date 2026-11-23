import { readFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('./status-tokens.json', import.meta.url), 'utf8'));

export function statusBadge(status, theme) {
  const token = Object.hasOwn(tokens.statuses, status) ? tokens.statuses[status] : tokens.fallback;
  return { label: token.label, ...token[theme] };
}
