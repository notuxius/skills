import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyInstalls } from './verify-installs.mjs';

const lab = fileURLToPath(new URL('../', import.meta.url));
const catalog = join(lab, '..');
const packageName = 'queue-lab-sdk';
const bundledName = 'queue-sdk';
const collision = 'queue-aqa';
const agents = ['.agents', '.claude'];
const cliPackage = 'skills@1.9.0';
const catalogNames = ['skills-upkeep', 'queue-ui', 'queue-api', 'queue-aqa', 'queue-design'];
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run via npm run skills:bundle-test');

function npm(directory, ...args) {
  return execFileSync(process.execPath, [npmCli, ...args], {
    cwd: directory, encoding: 'utf8', env: { ...process.env, DISABLE_TELEMETRY: '1' },
  });
}

function skills(directory, ...args) {
  return npm(directory, 'exec', '--yes', `--package=${cliPackage}`, '--', 'skills', ...args);
}

function write(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function skillFile(name, body) {
  return `---\nname: ${name}\ndescription: Test the lab SDK fixture with ${name}.\n---\n\n${body}\n`;
}

const temp = mkdtempSync(join(tmpdir(), 'queue-bundled-skills-'));
try {
  const fresh = join(temp, 'fresh-catalog');
  mkdirSync(fresh);
  skills(fresh, 'add', catalog, '--agent', 'codex', 'claude-code', '--copy', '--yes', '--skill', ...catalogNames);
  verifyInstalls(fresh, catalogNames, join(catalog, 'skills'));

  const project = join(temp, 'consumer');
  const appLock = join(project, 'package-lock.json');
  const skillLock = join(project, 'skills-lock.json');
  const installed = (agent, name) => join(project, agent, 'skills', name, 'SKILL.md');
  const sync = (...args) => skills(project, 'experimental_sync', '--agent', 'codex', 'claude-code',
    '--copy', '--yes', '--no-remote', '--no-cleanup', '--no-frozen-lockfile', '--include', packageName, ...args);
  const local = skillFile(collision, 'Use the queue project ownership convention.');
  write(join(project, 'package.json'), '{"name":"queue-consumer","private":true}\n');
  for (const agent of agents) write(installed(agent, collision), local);

  function installPackage(version, command) {
    const folder = join(temp, `sdk-${version}`);
    write(join(folder, 'package.json'), JSON.stringify({ name: packageName, version }));
    write(join(folder, 'report.cjs'), `process.exitCode = process.argv.slice(2).join(' ') === ${JSON.stringify(command)} ? 0 : 2;\n`);
    write(join(folder, 'skills', bundledName, 'SKILL.md'), skillFile(bundledName, `Run \`node report.cjs ${command}\`.`));
    write(join(folder, 'skills', collision, 'SKILL.md'), skillFile(collision, 'Bundled duplicate.'));
    const [pack] = JSON.parse(npm(temp, 'pack', '--offline', '--json', folder));
    npm(project, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, pack.filename));
    assert.equal(JSON.parse(readFileSync(appLock, 'utf8')).packages[`node_modules/${packageName}`].version, version);
  }

  const sdkReport = join(project, 'node_modules', packageName, 'report.cjs');
  installPackage('1.0.0', '--format json');
  execFileSync(process.execPath, [sdkReport, '--format', 'json']);
  const preview = sync('--dry-run');
  assert.match(preview, /queue-sdk/);
  assert.ok(!existsSync(skillLock), 'A dry run wrote the skill lock');
  for (const agent of agents) assert.ok(!existsSync(installed(agent, bundledName)));
  sync();
  const before = readFileSync(skillLock, 'utf8');
  const original = JSON.parse(before).skills[bundledName];
  assert.equal(original.source, packageName);
  assert.equal(original.sourceType, 'node_modules');
  assert.equal(original.version, '1.0.0');
  for (const agent of agents) {
    assert.match(readFileSync(installed(agent, bundledName), 'utf8'), /--format json/);
    assert.equal(readFileSync(installed(agent, collision), 'utf8'), local);
  }

  installPackage('2.0.0', '--output json');
  assert.throws(() => execFileSync(process.execPath, [sdkReport, '--format', 'json']), { status: 2 });
  execFileSync(process.execPath, [sdkReport, '--output', 'json']);
  const afterPackageUpgrade = readFileSync(appLock, 'utf8');
  assert.match(sync('--dry-run'), /queue-sdk/);
  assert.equal(readFileSync(skillLock, 'utf8'), before);
  for (const agent of agents) assert.match(readFileSync(installed(agent, bundledName), 'utf8'), /--format json/);
  sync();
  assert.equal(readFileSync(appLock, 'utf8'), afterPackageUpgrade);
  const updated = JSON.parse(readFileSync(skillLock, 'utf8')).skills;
  assert.equal(updated[bundledName].version, '2.0.0');
  assert.notEqual(updated[bundledName].computedHash, original.computedHash);
  assert.ok(!Object.hasOwn(updated, collision), 'The local skill became a managed npm skill');
  for (const agent of agents) {
    assert.match(readFileSync(installed(agent, bundledName), 'utf8'), /--output json/);
    assert.equal(readFileSync(installed(agent, collision), 'utf8'), local);
  }
  verifyInstalls(project, [bundledName, collision]);
  console.log('Bundled skill upgraded from 1.0.0 to 2.0.0. Dry run and local collision preserved.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
