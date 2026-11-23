import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const roles = ['queue-ui', 'queue-api', 'queue-aqa', 'queue-design'];
const catalog = process.argv[2] && resolve(process.argv[2], 'skills');
const names = catalog
  ? readdirSync(catalog, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
  : roles;

function files(directory, prefix = '') {
  return readdirSync(join(directory, prefix)).sort().flatMap(name => {
    const path = join(prefix, name);
    return statSync(join(directory, path)).isDirectory() ? files(directory, path) : [path];
  });
}

export function readDescription(directory, name) {
  assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const source = readFileSync(join(directory, 'SKILL.md'), 'utf8').replaceAll('\r\n', '\n');
  const header = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(header, name + ' is missing its skill header');
  const names = [...header[1].matchAll(/^name:[ \t]*(["']?)([a-z0-9-]+)\1[ \t]*$/gm)];
  assert.deepEqual(names.map(match => match[2]), [name], `${name} must declare its folder name once`);
  const descriptions = [...header[1].matchAll(/^description:[ \t]+(\S.*)$/gm)];
  assert.equal(descriptions.length, 1, `${name} must have one nonempty description`);
  return descriptions[0][1];
}

function verifyLinks(directory, paths) {
  for (const path of paths.filter(file => file.endsWith('.md'))) {
    const markdown = readFileSync(join(directory, path), 'utf8');
    for (const [, url] of markdown.matchAll(/\[[^\]\n]+\]\(([^()\s]+)\)/g)) {
      if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('#')) continue;
      const target = resolve(directory, dirname(path), decodeURIComponent(url.split(/[?#]/, 1)[0]));
      const fromSkill = relative(directory, target);
      assert.ok(fromSkill !== '..' && !fromSkill.startsWith(`..${sep}`) && !isAbsolute(fromSkill),
        `${path} refers to a file outside its install: ${url}`);
      assert.ok(existsSync(target), `${path} refers to a missing file: ${url}`);
    }
  }
}

export function verifyInstalls(consumer, skillNames, catalogSkills) {
  for (const name of skillNames) {
    const codex = join(consumer, '.agents', 'skills', name);
    const claude = join(consumer, '.claude', 'skills', name);
    const paths = files(codex);
    readDescription(codex, name);
    verifyLinks(codex, paths);
    for (const destination of [claude, ...(catalogSkills ? [join(catalogSkills, name)] : [])]) {
      assert.deepEqual(files(destination), paths, name + ' file list differs in ' + destination);
      for (const path of paths) {
        assert.deepEqual(readFileSync(join(destination, path)), readFileSync(join(codex, path)),
          name + '/' + path + ' differs in ' + destination);
      }
    }
    console.log(name + ' available to Codex and Claude Code' + (catalogSkills ? ', matches catalog' : ''));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyInstalls(project, names, catalog);
}
