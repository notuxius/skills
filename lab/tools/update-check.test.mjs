import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkForUpdate, readSkillVersion } from '../../skills/skills-upkeep/check-update.mjs';
import { release } from '../../telemetry/telemetry-schema.mjs';

const toggle = 'SKILLS_UPKEEP_CHECK_UPDATES';
const [major, minor, patch] = release.split('.').map(Number);
const newer = `v${major}.${minor}.${patch + 10}`;

function project(t) {
  const root = mkdtempSync(join(tmpdir(), 'skills-upkeep-update-'));
  const previous = process.env[toggle];
  delete process.env[toggle];
  t.after(() => {
    if (previous === undefined) delete process.env[toggle];
    else process.env[toggle] = previous;
    rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('the distributed skill and telemetry use the same version', () => {
  assert.equal(readSkillVersion(), release);
});

test('one anonymous GitHub request produces a notice for a newer stable release', async t => {
  const root = project(t);
  const fetchRelease = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ tag_name: newer, html_url: 'https://example.invalid' }));
  const timeout = t.mock.method(AbortSignal, 'timeout', () => new AbortController().signal);

  assert.equal(await checkForUpdate(root),
    `Skills Upkeep ${newer} is available. You’re running v${release}. ` +
    `[Release notes](https://github.com/notuxius/skills/releases/tag/${newer})`);
  assert.equal(fetchRelease.mock.callCount(), 1);
  const [url, options] = fetchRelease.mock.calls[0].arguments;
  assert.equal(url, 'https://api.github.com/repos/notuxius/skills/releases/latest');
  assert.deepEqual(options.headers, { accept: 'application/vnd.github+json' });
  assert.equal(options.redirect, 'error');
  assert.deepEqual(timeout.mock.calls[0].arguments, [3_000]);
});

test('other releases and request failures are silent', async t => {
  const root = project(t);
  const responses = [
    Response.json({ tag_name: `v${release}` }),
    Response.json({ tag_name: `v${major - 1}.99.99` }),
    Response.json({ tag_name: `${newer}-rc.1` }),
    Response.json({ tag_name: newer, prerelease: true }),
    Response.json({ tag_name: newer, draft: true }),
    Response.json({ tag_name: 42 }),
    new Response('invalid JSON'),
    new Response(null, { status: 429 }),
  ];
  t.mock.method(globalThis, 'fetch', async () => {
    if (responses.length) return responses.shift();
    throw new TypeError('offline');
  });
  while (responses.length) assert.equal(await checkForUpdate(root), undefined);
  assert.equal(await checkForUpdate(root), undefined);
});

test('the environment toggle prevents any update request', async t => {
  const root = project(t);
  process.env[toggle] = '0';
  const fetchRelease = t.mock.method(globalThis, 'fetch');
  assert.equal(await checkForUpdate(root), undefined);
  assert.equal(fetchRelease.mock.callCount(), 0);
});

for (const name of ['AGENTS.md', 'CLAUDE.md']) {
  test(`the project toggle in ${name} prevents any update request`, async t => {
    const root = project(t);
    writeFileSync(join(root, name), '# Project rules\r\n- Disable Skills Upkeep update checks for this project.\r\n');
    process.env[toggle] = '1';
    const fetchRelease = t.mock.method(globalThis, 'fetch');
    assert.equal(await checkForUpdate(root), undefined);
    assert.equal(fetchRelease.mock.callCount(), 0);
  });
}
