export function createQueueView(load) {
  let requestId = 0;
  let state = { filter: null, phase: 'idle', rows: [], error: null };

  async function refresh(filter) {
    const id = ++requestId;
    const rows = state.filter === filter ? state.rows : [];
    state = { filter, phase: 'loading', rows, error: null };

    try {
      const result = await load(filter);
      if (id === requestId) {
        state = { filter, phase: 'ready', rows: result, error: null };
      }
    } catch (error) {
      if (id === requestId) {
        const reason = typeof error === 'string' ? error : error?.message;
        const message = typeof reason === 'string' && reason.trim() ? reason : 'Unable to load the queue. Try again.';
        state = { filter, phase: 'error', rows, error: message };
      }
    }
  }

  return { refresh, snapshot: () => state };
}
