import assert from 'node:assert/strict';

export async function checkClaimRace(handle, ticketId) {
  const url = 'https://queue.test/tickets/' + encodeURIComponent(ticketId);
  const agents = ['ava', 'max'];

  async function claim(agentId) {
    const response = await handle(new Request(url + '/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId }),
    }));
    return { agentId, status: response.status, body: await response.json() };
  }

  const results = await Promise.all(agents.map(claim));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const winner = results.find(result => result.status === 200);
  const loser = results.find(result => result.status === 409);
  assert.equal(winner.body.assignee, winner.agentId);
  assert.equal(winner.body.id, ticketId);
  assert.deepEqual(loser.body, { error: 'already_claimed' });

  const retry = await claim(winner.agentId);
  assert.equal(retry.status, 200);
  assert.deepEqual(retry.body, winner.body);
}
