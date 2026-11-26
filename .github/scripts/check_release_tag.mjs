import { readFileSync } from 'node:fs';
import { release } from '../../telemetry/telemetry-schema.mjs';

const stableTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const tag = process.argv[2];
const skill = readFileSync(new URL('../../skills/skills-upkeep/SKILL.md', import.meta.url), 'utf8');
const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
const skillVersion = frontmatter?.match(/^metadata:\r?\n  version: "([^"\r\n]+)"[ \t]*\r?$/m)?.[1];

if (!stableTag.test(tag)) {
  console.error('Expected a stable release tag in vMAJOR.MINOR.PATCH format.');
  process.exitCode = 1;
} else if (tag !== `v${release}`) {
  console.error(`Telemetry release ${release} must match ${tag}.`);
  process.exitCode = 1;
} else if (tag !== `v${skillVersion}`) {
  console.error(`Skill version ${skillVersion ?? '(missing)'} must match ${tag}.`);
  process.exitCode = 1;
}
