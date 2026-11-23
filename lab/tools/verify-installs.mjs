import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const roles = ['queue-ui', 'queue-api', 'queue-aqa', 'queue-design'];
const catalog = process.argv[2] && resolve(process.argv[2], 'skills');

function files(directory, prefix = '') {
  return readdirSync(join(directory, prefix)).sort().flatMap(name => {
    const path = join(prefix, name);
    return statSync(join(directory, path)).isDirectory() ? files(directory, path) : [path];
  });
}

for (const name of roles) {
  const codex = join(project, '.agents', 'skills', name);
  const claude = join(project, '.claude', 'skills', name);
  const paths = files(codex);
  assert.ok(paths.includes('SKILL.md'), name + ' is missing its instructions');
  const source = readFileSync(join(codex, 'SKILL.md'), 'utf8').replaceAll('\r\n', '\n');
  const header = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(header, name + ' is missing its skill header');
  assert.match(header[1], new RegExp('^name:[ \\t]*["\']?' + name + '["\']?[ \\t]*$', 'm'));
  assert.match(header[1], /^description:[ \t]*\S/m);
  for (const destination of [claude, ...(catalog ? [join(catalog, name)] : [])]) {
    assert.deepEqual(files(destination), paths, name + ' file list differs in ' + destination);
    for (const path of paths) {
      assert.deepEqual(readFileSync(join(destination, path)), readFileSync(join(codex, path)),
        name + '/' + path + ' differs in ' + destination);
    }
  }
  console.log(name + ' available to Codex and Claude Code' + (catalog ? ', matches catalog' : ''));
}
