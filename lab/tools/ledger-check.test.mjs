import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkLedger } from '../../skills/skills-upkeep/check-ledger.mjs';

const checker = fileURLToPath(new URL('../../skills/skills-upkeep/check-ledger.mjs', import.meta.url));
const ledger = `## Skill reviews

| Skill | Reviewed | Next due | Reason | Synced from |
|---|---|---|---|---|
| aspire | 2026-11-25 | 2027-02-25 | Runtime \`podman\` \\| local setup | \`aspire@13.6.0\` |
| playwright-cli | 2026-11-25 | 2027-02-23 | | \`@playwright/cli@0.1.22\` |

## Project package coverage

| Workspace | Package and workflow |
|---|---|
| tests | Playwright |
`;

test('a tool version change flags an early re-sync and a stale due date is corrected', () => {
  assert.deepEqual(checkLedger(ledger, ['aspire@13.7.0+commit', '@playwright/cli@0.1.22'], '2026-11-26'), [
    'aspire | Next due 2027-02-23 | ledger Next due is 2027-02-25 | re-sync due (aspire synced from 13.6.0, installed 13.7.0)',
    'playwright-cli | Next due 2027-02-23',
  ]);
});

test('a review becomes due on day 90 and an unavailable version is unverified', () => {
  const matchingAspire = ['aspire@13.6.0+commit'];
  assert.match(checkLedger(ledger, matchingAspire, '2027-02-22')[0], /Next due 2027-02-23 \| ledger/);
  assert.deepEqual(checkLedger(ledger, matchingAspire, '2027-02-23'), [
    'aspire | Next due 2027-02-23 (review due) | ledger Next due is 2027-02-25',
    'playwright-cli | Next due 2027-02-23 (review due) | installed @playwright/cli version unverified',
  ]);
});

test('the CLI reads older ledgers without changing them and generates dates for new rows', t => {
  const root = mkdtempSync(join(tmpdir(), 'skills-upkeep-ledger-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = join(root, 'reviewed.md');
  const legacy = '| Skill | Reviewed | Outcome |\r\n|---|---|---|\r\n| queue-ui | 2024-02-29 | no change |\r\n';
  writeFileSync(path, legacy);
  const run = (...args) => execFileSync(process.execPath, [checker, ...args], { encoding: 'utf8', windowsHide: true });
  assert.match(run(path), /queue-ui \| Next due 2024-05-29.*\| ledger Next due missing/);
  assert.equal(readFileSync(path, 'utf8'), legacy);
  assert.equal(run('--next-due', '2026-11-25').trim(), '2027-02-23');
  assert.match(checkLedger(legacy.replace('2024-02-29', '2026-02-29'), [], '2026-03-01')[0], /Invalid Reviewed date/);
});
