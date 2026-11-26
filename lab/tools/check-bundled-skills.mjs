import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyInstalls } from './verify-installs.mjs';

const lab = fileURLToPath(new URL('../', import.meta.url));
const catalog = join(lab, '..');
const packageName = 'queue-lab-sdk';
const bundledName = 'queue-sdk';
const collision = 'queue-aqa';
const unreviewed = 'queue-export';
const agents = ['.agents', '.claude'];
const cliPackage = 'skills@1.9.0';
const catalogSkills = join(catalog, 'skills');
const catalogNames = readdirSync(catalogSkills, { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name);
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
  verifyInstalls(fresh, catalogNames, catalogSkills);
  const listed = JSON.parse(skills(fresh, 'list', '--json'));
  for (const name of catalogNames) {
    assert.ok(listed.some(entry => entry.name === name && entry.scope === 'project'), `CLI did not discover ${name}`);
  }

  const project = join(temp, 'consumer');
  const appLock = join(project, 'package-lock.json');
  const skillLock = join(project, 'skills-lock.json');
  const installed = (agent, name) => join(project, agent, 'skills', name, 'SKILL.md');
  const syncFlags = ['--agent', 'codex', 'claude-code', '--copy', '--no-remote', '--no-cleanup', '--no-frozen-lockfile'];
  const workflow = readFileSync(join(catalogSkills, 'skills-upkeep', 'SKILL.md'), 'utf8');
  assert.ok(workflow.includes(`skills experimental_sync --dry-run ${syncFlags.join(' ')} --include '<package>'`),
    'Exercise the preview and apply flags from the published workflow');
  const sync = (include, ...args) => skills(project, 'experimental_sync', ...syncFlags, '--include', include, ...args, '--yes');
  const selection = `${packageName}#${bundledName}`;
  const local = skillFile(collision, 'Use the queue project ownership convention.');
  write(join(project, 'package.json'), '{"name":"queue-consumer","private":true}\n');
  for (const agent of agents) write(installed(agent, collision), local);

  function installPackage(version, command) {
    const folder = join(temp, `sdk-${version}`);
    write(join(folder, 'package.json'), JSON.stringify({ name: packageName, version }));
    write(join(folder, 'report.cjs'), `process.exitCode = process.argv.slice(2).join(' ') === ${JSON.stringify(command)} ? 0 : 2;\n`);
    const skillFolder = join(folder, 'skills', bundledName);
    write(join(skillFolder, 'SKILL.md'), skillFile(bundledName,
      `Run \`node report.cjs ${command}\`. See [the reference][report].\n\n[report]: reporting.md "Report command"`));
    write(join(skillFolder, 'reporting.md'), `# Report command\n\nUse \`node report.cjs ${command}\`.\n`);
    write(join(folder, 'skills', collision, 'SKILL.md'), skillFile(collision, 'Bundled duplicate.'));
    write(join(folder, 'skills', unreviewed, 'SKILL.md'), skillFile(unreviewed, 'Bundled export instructions.'));
    const [pack] = JSON.parse(npm(temp, 'pack', '--offline', '--json', folder));
    npm(project, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, pack.filename));
    assert.equal(JSON.parse(readFileSync(appLock, 'utf8')).packages[`node_modules/${packageName}`].version, version);
  }

  const sdkReport = join(project, 'node_modules', packageName, 'report.cjs');
  installPackage('1.0.0', '--format json');
  execFileSync(process.execPath, [sdkReport, '--format', 'json']);
  assert.throws(() => execFileSync(process.execPath, [sdkReport, '--output', 'json']), { status: 2 });
  const preview = sync(packageName, '--dry-run');
  assert.match(preview, /queue-sdk/);
  assert.match(preview, /queue-export/);
  assert.ok(!existsSync(skillLock), 'A dry run wrote the skill lock');
  for (const agent of agents) {
    assert.ok(!existsSync(installed(agent, bundledName)));
    assert.equal(readFileSync(installed(agent, collision), 'utf8'), local);
  }
  assert.doesNotMatch(sync(selection, '--dry-run'), /queue-export/);
  // Include the colliding skill on the first sync to exercise the CLI's preservation rule.
  sync(packageName, '--exclude', `${packageName}#${unreviewed}`);
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
  assert.equal(readFileSync(skillLock, 'utf8'), before);
  for (const agent of agents) {
    const directory = dirname(installed(agent, bundledName));
    assert.match(readFileSync(join(directory, 'SKILL.md'), 'utf8'), /--format json/);
    assert.match(readFileSync(join(directory, 'reporting.md'), 'utf8'), /--format json/);
  }
  assert.throws(() => execFileSync(process.execPath, [sdkReport, '--format', 'json']), { status: 2 });
  execFileSync(process.execPath, [sdkReport, '--output', 'json']);
  const afterPackageUpgrade = readFileSync(appLock, 'utf8');
  assert.match(sync(packageName, '--dry-run'), /queue-sdk/);
  assert.equal(readFileSync(skillLock, 'utf8'), before);
  assert.equal(readFileSync(appLock, 'utf8'), afterPackageUpgrade);
  for (const agent of agents) assert.match(readFileSync(installed(agent, bundledName), 'utf8'), /--format json/);
  sync(selection);
  assert.equal(readFileSync(appLock, 'utf8'), afterPackageUpgrade);
  const updated = JSON.parse(readFileSync(skillLock, 'utf8')).skills;
  assert.equal(updated[bundledName].version, '2.0.0');
  assert.notEqual(updated[bundledName].computedHash, original.computedHash);
  assert.deepEqual(Object.keys(updated), [bundledName]);
  for (const agent of agents) {
    assert.match(readFileSync(installed(agent, bundledName), 'utf8'), /--output json/);
    assert.equal(readFileSync(installed(agent, collision), 'utf8'), local);
    assert.ok(!existsSync(installed(agent, unreviewed)));
  }
  verifyInstalls(project, [bundledName, collision]);
  const entrypoint = installed('.agents', bundledName);
  writeFileSync(entrypoint, readFileSync(entrypoint, 'utf8').replace('reporting.md', 'missing.md'));
  assert.throws(() => verifyInstalls(project, [bundledName]), /refers to a missing file: missing\.md/);
  console.log('Bundled skill upgraded from 1.0.0 to 2.0.0. Dry run and local collision preserved.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
