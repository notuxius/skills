import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { release, schemaVersion } from '../../telemetry/telemetry-schema.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const helper = join(root, 'telemetry', 'telemetry.mjs');
const receiver = join(root, 'telemetry', 'receiver.mjs');
const exec = promisify(execFile);
const runNode = async (args, options) => {
  const { stdout } = await exec(process.execPath, args, {
    timeout: 10_000, windowsHide: true, ...options,
  });
  return JSON.parse(stdout);
};

async function fixture(t) {
  const folder = mkdtempSync(join(tmpdir(), 'skills-upkeep-telemetry-'));
  const stateDir = join(folder, 'consent');
  const database = join(folder, 'events.sqlite');
  const receiverProcess = spawn(process.execPath, [receiver, 'serve', database, '0'], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  t.after(async () => {
    if (receiverProcess.pid && receiverProcess.exitCode === null && receiverProcess.signalCode === null) {
      const exit = once(receiverProcess, 'exit');
      receiverProcess.kill();
      await exit;
    }
    rmSync(folder, { recursive: true, force: true });
  });
  const lines = createInterface({ input: receiverProcess.stdout });
  const [endpoint] = await once(lines, 'line', { signal: AbortSignal.timeout(10_000) });
  lines.close();
  const env = {
    ...process.env,
    CI: '',
    DISABLE_TELEMETRY: '',
    DO_NOT_TRACK: '',
    SKILLS_UPKEEP_TELEMETRY: '',
    SKILLS_UPKEEP_TELEMETRY_STATE_DIR: stateDir,
    SKILLS_UPKEEP_TELEMETRY_URL: endpoint,
  };
  const run = (args, overrides = {}, cwd = folder) =>
    runNode([helper, ...args], { cwd, env: { ...env, ...overrides } });
  const report = () => runNode([receiver, 'report', database]);
  return { endpoint, folder, report, run, stateDir };
}

test('interactive telemetry requires explicit consent in each checkout', async t => {
  const { endpoint, folder, report, run, stateDir } = await fixture(t);
  const record = ['record', 'apply', 'bootstrap', 'passed'];
  assert.deepEqual(await run(['status'], { SKILLS_UPKEEP_TELEMETRY_URL: '' }), { state: 'unconfigured' });
  const status = await run(['status']);
  assert.deepEqual(status, {
    state: 'available',
    endpoint,
    sample: { schema_version: schemaVersion, release, workflow: 'bootstrap', verification: 'passed' },
  });
  assert.deepEqual(await run(record), { state: 'skipped' });
  await assert.rejects(run(['record', 'report-only', 'bootstrap', 'passed']), /Usage:/);
  assert.equal(existsSync(stateDir), false);
  assert.deepEqual(await report(), []);

  assert.deepEqual(await run(['enable', endpoint]), { state: 'enabled', endpoint });
  const other = join(folder, 'another-checkout');
  mkdirSync(other);
  assert.deepEqual(await run(record, {}, other), { state: 'skipped' });
  assert.deepEqual(await run(record), { state: 'sent' });
  const [row, ...rest] = await report();
  assert.deepEqual(rest, []);
  const { day, ...countedEvent } = row;
  assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(countedEvent, { ...status.sample, count: 1 });

  assert.deepEqual(await run(['disable']), { state: 'disabled' });
  assert.deepEqual(await run(record), { state: 'skipped' });
});

test('CI opt-in is separate and opt-out flags take precedence', async t => {
  const { endpoint, report, run } = await fixture(t);
  const record = ['record', 'apply', 'dependency-change', 'passed'];
  await run(['enable', endpoint]);
  assert.deepEqual(await run(record, { CI: 'true' }), { state: 'skipped' });
  for (const variable of ['DISABLE_TELEMETRY', 'DO_NOT_TRACK']) {
    assert.deepEqual(await run(record, { [variable]: '1' }), { state: 'skipped' });
  }
  assert.deepEqual(await run(record, { SKILLS_UPKEEP_TELEMETRY: '0' }), { state: 'skipped' });
  assert.deepEqual(await report(), []);
  assert.deepEqual(await run(record, { CI: 'true', SKILLS_UPKEEP_TELEMETRY: '1' }), { state: 'sent' });
  const rows = await report();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].workflow, 'dependency-change');
  assert.equal(rows[0].verification, 'passed');
  assert.equal(rows[0].count, 1);
});

test('the receiver rejects unknown data and only aggregates valid events', async t => {
  const { endpoint, report, run } = await fixture(t);
  const post = body => fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const { sample } = await run(['status']);
  assert.equal((await post({ ...sample, project: 'fixture' })).status, 400);
  assert.equal((await post({ ...sample, release: 'v2.1.0' })).status, 400);
  assert.equal((await post({ ...sample, project: 'x'.repeat(600) })).status, 413);
  assert.deepEqual(await report(), []);
  assert.equal((await post(sample)).status, 204);
  assert.equal((await post(sample)).status, 204);
  const rows = await report();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 2);
});

test('only HTTPS and loopback HTTP endpoints can receive telemetry', async t => {
  const { run } = await fixture(t);
  for (const endpoint of [
    'http://example.com/events',
    'https://user:password@example.com/events',
    'https://example.com/events?secret=fixture',
    'https://example.com/events#identifier',
  ]) {
    await assert.rejects(run(['enable', endpoint]), /Provide an HTTPS endpoint/);
  }
  assert.deepEqual(await run(['enable', 'http://127.0.0.1:1/v1/events']), {
    state: 'enabled',
    endpoint: 'http://127.0.0.1:1/v1/events',
  });
  assert.deepEqual(await run(['record', 'apply', 'bootstrap', 'failed']), { state: 'unavailable' });
});
