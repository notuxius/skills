import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const releases = 'https://github.com/notuxius/skills/releases';
const latestRelease = 'https://api.github.com/repos/notuxius/skills/releases/latest';
const projectOptOut = /^[ \t]*(?:[-*+][ \t]+)?Disable Skills Upkeep update checks for this project\.[ \t]*\r?$/im;
export const stableTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function readSkillVersion() {
  const skill = readFileSync(new URL('SKILL.md', import.meta.url), 'utf8');
  const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  return frontmatter?.match(/^metadata:\r?\n  version: "([^"\r\n]+)"[ \t]*\r?$/m)?.[1];
}

export async function checkForUpdate(projectRoot = process.cwd()) {
  if (process.env.SKILLS_UPKEEP_CHECK_UPDATES === '0') return;

  try {
    for (const name of ['AGENTS.md', 'CLAUDE.md']) {
      const path = join(projectRoot, name);
      if (existsSync(path) && projectOptOut.test(readFileSync(path, 'utf8'))) return;
    }

    const installed = readSkillVersion();
    if (!stableTag.test(`v${installed}`)) return;

    const response = await fetch(latestRelease, {
      headers: { accept: 'application/vnd.github+json' },
      redirect: 'error',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return;

    const { tag_name: tag, draft, prerelease } = await response.json();
    if (draft || prerelease || typeof tag !== 'string' || !stableTag.test(tag)) return;

    const current = installed.split('.').map(BigInt);
    const latest = tag.slice(1).split('.').map(BigInt);
    const changed = latest.findIndex((part, index) => part !== current[index]);
    if (changed !== -1 && latest[changed] > current[changed]) {
      return `Skills Upkeep ${tag} is available. You’re running v${installed}. [Release notes](${releases}/tag/${tag})`;
    }
  } catch {
    // A failed check is silent so the requested workflow can continue.
  }
}

if (import.meta.main) {
  const notice = await checkForUpdate();
  if (notice) console.log(notice);
}
