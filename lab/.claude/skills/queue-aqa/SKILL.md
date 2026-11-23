---
name: queue-aqa
description: Design automated regression tests for competing support-ticket claims through a public API. Use for concurrent requests, retry coverage, persisted-state checks, and demonstrating that a test detects a lost ownership update.
---

# Test competing ticket claims

Give every test a fresh queue and an unassigned ticket. Use two distinct agent identities. Exercise the public request handler or HTTP endpoint so validation, response serialization and state updates are all observable.

Start both claims before awaiting either one. Determine the winner from the responses and assert exactly one success and one conflict. Assert the conflict error code, then read the ticket with a new request and compare its owner with the winning caller. Replay the winner's claim to check that the acknowledged result survives a retry.

Avoid timing assumptions. Use a request barrier if the project has one, or launch both promises together for an in-process handler. Do not require a particular caller to win.

Prove the regression check detects a service that returns the expected conflict but changes the stored owner. Run the same assertions against the real implementation and a deliberately faulty test double. Ensure the faulty implementation fails specifically at the ownership readback.
