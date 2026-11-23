---
name: queue-api
description: Implement or review a support-queue backend operation that changes ticket ownership. Use for claim and retry semantics, API error contracts, and competing writes to one ticket.
---

# Implement ticket claims

Read the route, ticket representation, and existing contract tests before changing the write path. Identify the unassigned value, the caller identity and the response consumers expect. Use the service's established identity source.

| State before the request | Claim result | Stored owner |
|---|---|---|
| Unassigned | Success with the claimed ticket | Caller |
| Owned by the caller | Repeat the success response | Caller |
| Owned by another agent | Conflict using the service's error shape | Prior owner |

Validate the payload before writing. A malformed request and a missing ticket must leave the queue intact. Keep fixture state private to each test.

Keep the ownership check and write atomic. With an in-memory handler, await input parsing before reading ownership and keep the check and assignment synchronous. For a database, use its conditional-write or transaction primitive and inspect the stored owner after a failed write to distinguish a retry from a conflict.

After a competing claim, read the ticket through the public API and verify the original owner survived. Run the backend contract tests and report the route, observable response and persisted state.
