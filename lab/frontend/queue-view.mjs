export function createQueueView(load) {
  let requestId = 0;
  let state = { filter: null, phase: 'idle', rows: [], error: null };

  async function refresh(filter) {
    const id = ++requestId;
    const rows = state.filter === filter ? state.rows : [];
    state = { filter, phase: 'loading', rows, error: null };

    try {
      const result = await load(filter);
      if (filter === state.filter) {
        state = { filter, phase: 'ready', rows: result, error: null };
      }
    } catch (error) {
      if (filter === state.filter) {
        state = { filter, phase: 'error', rows, error: error.message };
      }
    }
  }

  return { refresh, snapshot: () => state };
}
