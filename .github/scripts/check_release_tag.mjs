import { release } from '../../telemetry/telemetry-schema.mjs';

const tag = process.argv[2];
const stableTag = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

if (!stableTag.test(tag)) {
  console.error('Expected a stable release tag in vMAJOR.MINOR.PATCH format.');
  process.exitCode = 1;
} else if (tag !== `v${release}`) {
  console.error(`Telemetry release ${release} must match ${tag}.`);
  process.exitCode = 1;
}
