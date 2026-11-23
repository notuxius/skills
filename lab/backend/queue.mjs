function errorResponse(status, error) {
  return Response.json({ error }, { status });
}

export function createQueue(initialTickets) {
  const tickets = new Map(initialTickets.map(ticket => [
    ticket.id, { ...ticket, assignee: ticket.assignee ?? null },
  ]));

  return async function handle(request) {
    const path = new URL(request.url).pathname;
    const route = /^\/tickets\/([\w-]+)(\/claim)?$/.exec(path);
    if (!route || !tickets.has(route[1])) {
      return errorResponse(404, 'ticket_not_found');
    }
    const ticket = tickets.get(route[1]);
    const expectedMethod = route[2] ? 'POST' : 'GET';
    if (request.method !== expectedMethod) {
      return Response.json({ error: 'method_not_allowed' }, {
        status: 405, headers: { Allow: expectedMethod },
      });
    }
    if (request.method === 'GET') return Response.json(ticket);

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, 'invalid_agent');
    }
    if (typeof body?.agentId !== 'string' || !body.agentId.trim()) {
      return errorResponse(400, 'invalid_agent');
    }
    const agentId = body.agentId.trim();
    if (ticket.assignee !== null && ticket.assignee !== agentId) {
      return errorResponse(409, 'already_claimed');
    }
    ticket.assignee = agentId;
    return Response.json(ticket);
  };
}
