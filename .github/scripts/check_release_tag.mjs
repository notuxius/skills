import { release } from '../../telemetry/telemetry-schema.mjs';
import { readSkillVersion, stableTag } from '../../skills/skills-upkeep/check-update.mjs';

const tag = process.argv[2];
const skillVersion = readSkillVersion();

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
