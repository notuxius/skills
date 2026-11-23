import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueue } from './queue.mjs';

const ticket = { id: 'Q-101', title: 'Cannot open the inbox', assignee: null };
const url = 'https://queue.test/tickets/Q-101';
function post(body) {
  return new Request(url + '/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

test('a claim and its retry return the same stored ticket', async () => {
  const handle = createQueue([ticket]);
  const expected = { ...ticket, assignee: 'agent-jen' };
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await handle(post(JSON.stringify({ agentId: 'agent-jen' })));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
  }
  const stored = await handle(new Request(url));
  assert.deepEqual(await stored.json(), expected);
  assert.equal(ticket.assignee, null, 'the seed is reusable by other queues');
});

test('a competing claim cannot replace the recorded owner', async () => {
  const handle = createQueue([{ ...ticket, assignee: 'agent-jen' }]);
  const conflict = await handle(post(JSON.stringify({ agentId: 'agent-omar' })));
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), { error: 'already_claimed' });
  const stored = await handle(new Request(url));
  assert.equal((await stored.json()).assignee, 'agent-jen');
});

test('invalid input leaves the stored ticket unassigned', async () => {
  const handle = createQueue([ticket]);
  for (const body of ['{', 'null', '{}', '{"agentId":" "}', '{"agentId":12}']) {
    const response = await handle(post(body));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid_agent' });
  }
  const stored = await handle(new Request(url));
  assert.deepEqual(await stored.json(), ticket);
});

test('an unknown ticket returns a stable not-found response', async () => {
  const handle = createQueue([]);
  const response = await handle(post(JSON.stringify({ agentId: 'agent-jen' })));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'ticket_not_found' });
});
