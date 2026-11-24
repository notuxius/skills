import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readDescription } from './verify-installs.mjs';

const catalog = fileURLToPath(new URL('../../skills/', import.meta.url));
const probes = [
  ['queue-ui', 'Two refreshes of the same filter can show stale rows in the support queue. Fix the client-side list and keep its loading and retry behavior.'],
  ['queue-api', 'Implement ticket ownership changes in the support-queue backend. Preserve the first owner when two callers race and keep the API conflict and retry contract.'],
  ['queue-aqa', 'Add automated regression tests for concurrent requests claiming a support ticket. Verify persisted ownership through the public API.'],
  ['queue-design', 'Prepare the status-badge handoff. Supply visible status labels in light and dark palettes and a fallback for unfamiliar values.'],
  ['queue-devops', 'Review the deployment rollout plan, CI release gates, staging smoke checks, and rollback preparation.'],
  ['queue-devops', 'Plan the deployment rollout and rollback for a dependency upgrade. Check staging smoke checks and CI release gates.'],
  ['queue-docs', 'Write help articles for agents using the ticket queue, with screenshots, prerequisites, and troubleshooting instructions.'],
  ['skills-upkeep', 'Audit our project skills after a dependency upgrade. Match them to the packages each workspace uses and flag outdated guidance.'],
  ['skills-upkeep', 'Maintain and update our project skills when dependencies change.'],
  ['skills-upkeep', 'Review the project setup change and update the affected skills after switching the workspace runtime. Preserve our project rules.'],
  ['skills-upkeep', 'Open a GitHub pull request for these skills upkeep changes.'],
  ['skills-upkeep', 'File a bug report about Skills Upkeep skipping a package during bootstrap.'],
  ['skills-upkeep', 'File a feature suggestion for Skills Upkeep to support custom review intervals.'],
  ['queue-aqa', 'The backend claim and retry logic belongs to another engineer. Add only an automated regression test for a lost ownership update. Exercise concurrent requests through the public API and verify persisted state.'],
];

function words(text) {
  return new Set(text.toLowerCase().match(/[a-z]{4,}/g));
}

const descriptions = new Map(readdirSync(catalog, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(({ name }) => [name, words(readDescription(join(catalog, name), name))]));

test('every catalog skill has a routing prompt', () => {
  assert.deepEqual(new Set(probes.map(([skill]) => skill)), new Set(descriptions.keys()));
});

// A lexical smoke test catches lost trigger vocabulary. Role exercises score actual agent output.
for (const [expected, prompt] of probes) {
  test(`metadata routes to ${expected}: ${prompt}`, () => {
    const query = words(prompt);
    const ranked = [...descriptions].map(([name, description]) => ({
      name,
      score: [...query].filter(word => description.has(word)).length,
    })).sort((left, right) => right.score - left.score);
    assert.equal(ranked[0].name, expected, JSON.stringify(ranked));
    assert.ok(ranked[0].score > (ranked[1]?.score ?? 0), JSON.stringify(ranked));
  });
}
