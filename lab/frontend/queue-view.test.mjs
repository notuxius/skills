import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueueView } from './queue-view.mjs';

function controlledQueue() {
  const requests = [];
  const view = createQueueView(filter => new Promise((resolve, reject) => {
    requests.push({ filter, resolve, reject });
  }));
  return { view, requests };
}

test('filter changes show a pending view for the new filter, then an empty ready view', async () => {
  const { view, requests } = controlledQueue();
  const initial = view.refresh('open');
  assert.equal(requests[0].filter, 'open');
  requests[0].resolve(['T-11']);
  await initial;
  const waiting = view.refresh('waiting');
  assert.deepEqual(view.snapshot(), { filter: 'waiting', phase: 'loading', rows: [], error: null });
  requests[1].resolve([]);
  await waiting;
  assert.deepEqual(view.snapshot(), { filter: 'waiting', phase: 'ready', rows: [], error: null });
});

test('a failed refresh retains rows for the same filter and retry clears the error', async () => {
  const { view, requests } = controlledQueue();
  const initial = view.refresh('open');
  requests[0].resolve(['T-11']);
  await initial;
  const failed = view.refresh('open');
  requests[1].reject(new Error('Queue unavailable'));
  await failed;
  assert.deepEqual(view.snapshot(), {
    filter: 'open', phase: 'error', rows: ['T-11'], error: 'Queue unavailable',
  });
  const retry = view.refresh('open');
  assert.deepEqual(view.snapshot(), { filter: 'open', phase: 'loading', rows: ['T-11'], error: null });
  requests[2].resolve(['T-12']);
  await retry;
  assert.deepEqual(view.snapshot().rows, ['T-12']);
});

test('an earlier success cannot replace the newer result even for the same filter', async () => {
  const { view, requests } = controlledQueue();
  const earlier = view.refresh('open');
  const later = view.refresh('open');
  requests[1].resolve(['T-12']);
  await later;
  requests[0].resolve(['T-11']);
  await earlier;
  assert.deepEqual(view.snapshot(), { filter: 'open', phase: 'ready', rows: ['T-12'], error: null });
});

test('a rejected refresh exposes a message and can be retried', async () => {
  const { view, requests } = controlledQueue();
  const fallback = 'Unable to load the queue. Try again.';
  for (const [reason, message] of [[null, fallback], [undefined, fallback], [' ', fallback], ['Offline', 'Offline']]) {
    const pending = view.refresh('open');
    requests.at(-1).reject(reason);
    await pending;
    assert.equal(view.snapshot().phase, 'error');
    assert.equal(view.snapshot().error, message);
  }
  const retry = view.refresh('open');
  requests.at(-1).resolve(['T-11']);
  await retry;
  assert.deepEqual(view.snapshot(), { filter: 'open', phase: 'ready', rows: ['T-11'], error: null });
});

test('an earlier failure cannot interrupt another filter that is still loading', async () => {
  const { view, requests } = controlledQueue();
  const earlier = view.refresh('open');
  const later = view.refresh('waiting');
  requests[0].reject(new Error('Queue unavailable'));
  await earlier;
  assert.deepEqual(view.snapshot(), { filter: 'waiting', phase: 'loading', rows: [], error: null });
  requests[1].resolve(['T-13']);
  await later;
  assert.deepEqual(view.snapshot(), { filter: 'waiting', phase: 'ready', rows: ['T-13'], error: null });
});
