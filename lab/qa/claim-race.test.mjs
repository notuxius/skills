import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueue } from '../backend/queue.mjs';
import { checkClaimRace } from './check-claim-race.mjs';

const ticket = { id: 'Q-205', title: 'Missing delivery update', assignee: null };

test('exactly one simultaneous claim wins and a readback agrees', async () => {
  await checkClaimRace(createQueue([ticket]), ticket.id);
});

test('the regression check detects a silent overwrite on conflict', async () => {
  const handle = createQueue([ticket]);
  let overwrittenOwner;
  // Simulate a service that reports the expected conflict yet exposes the losing owner.
  async function brokenService(request) {
    if (request.method === 'POST') {
      const savedBody = request.clone();
      const response = await handle(request);
      if (response.status === 409) overwrittenOwner = (await savedBody.json()).agentId;
      return response;
    }
    const response = await handle(request);
    const stored = await response.json();
    return Response.json({ ...stored, assignee: overwrittenOwner ?? stored.assignee });
  }
  await assert.rejects(() => checkClaimRace(brokenService, ticket.id), error =>
    error.code === 'ERR_ASSERTION' &&
    error.message.includes('persisted owner must match the winning claim'));
});
