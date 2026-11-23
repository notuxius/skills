import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isTelemetryEvent, release, schemaVersion } from './telemetry-schema.mjs';

const env = process.env;
const inCI = !/^(?:0|false|no|off)?$/i.test(env.CI ?? '');
const blocked = Boolean(env.DO_NOT_TRACK || env.DISABLE_TELEMETRY || env.SKILLS_UPKEEP_TELEMETRY === '0');
const stateDir = env.SKILLS_UPKEEP_TELEMETRY_STATE_DIR || join(homedir(), '.skills-upkeep', 'telemetry');

function endpointUrl(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return undefined;
    const loopback = url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname);
    return url.protocol === 'https:' || loopback ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function projectStatePath() {
  const projectKey = createHash('sha256').update(realpathSync('.')).digest('hex');
  return join(stateDir, `${projectKey}.json`);
}

function readConsent() {
  try {
    const stored = JSON.parse(readFileSync(projectStatePath(), 'utf8'));
    return { endpoint: endpointUrl(stored.endpoint) };
  } catch (error) {
    return error.code === 'ENOENT' ? undefined : {};
  }
}

function saveConsent(endpoint) {
  const file = projectStatePath();
  const temporary = `${file}.${randomUUID()}.tmp`;
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(temporary, JSON.stringify({ endpoint }), { flag: 'wx', mode: 0o600 });
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function eventFor(workflow, verification) {
  return { schema_version: schemaVersion, release, workflow, verification };
}

function status() {
  if (blocked) return { state: 'blocked' };
  const configured = endpointUrl(env.SKILLS_UPKEEP_TELEMETRY_URL);
  if (inCI) {
    return env.SKILLS_UPKEEP_TELEMETRY === '1' && configured
      ? { state: 'enabled', endpoint: configured }
      : { state: 'disabled' };
  }
  const consent = readConsent();
  if (consent) {
    return consent.endpoint ? { state: 'enabled', endpoint: consent.endpoint } : { state: 'disabled' };
  }
  return configured
    ? { state: 'available', endpoint: configured, sample: eventFor('bootstrap', 'passed') }
    : { state: 'unconfigured' };
}

async function run(args) {
  const [command, mode, workflow, verification] = args;
  if (command === 'status' && args.length === 1) return status();
  if (command === 'enable' && args.length === 2) {
    const endpoint = endpointUrl(mode);
    if (!endpoint) throw new Error('Provide an HTTPS endpoint or a loopback HTTP endpoint without credentials, query or fragment.');
    saveConsent(endpoint);
    return status();
  }
  if (command === 'disable' && args.length === 1) {
    saveConsent(null);
    return status();
  }
  if (command === 'record' && args.length === 4 && mode === 'apply') {
    const event = eventFor(workflow, verification);
    if (!isTelemetryEvent(event)) throw new Error('Invalid telemetry workflow or verification result.');
    const consent = status();
    if (consent.state !== 'enabled') return { state: 'skipped' };
    try {
      const response = await fetch(consent.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(1500),
      });
      await response.body?.cancel();
      return { state: response.ok ? 'sent' : 'unavailable' };
    } catch {
      return { state: 'unavailable' };
    }
  }
  throw new Error('Usage: telemetry.mjs status | enable <endpoint> | disable | record apply <workflow> <verification>');
}

try {
  console.log(JSON.stringify(await run(process.argv.slice(2))));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
