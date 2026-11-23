---
name: queue-devops
description: Plan or review a support-queue deployment. Use for CI release gates, staging smoke checks, rollout monitoring, and rollback preparation.
---

# Deploy a support queue

Read the current deployment workflow and runbook. Identify the artifact and environment, the checks that gate promotion, and the last known good revision. Use the project's existing release commands and monitoring.

- Run the relevant build and contract checks before promotion. Check that the deployed revision matches the artifact CI verified.
- Smoke-test staging with a dedicated disposable ticket. Check that the queue loads, claim the ticket, and read it again to confirm the stored owner. If a second caller can claim tickets, verify its attempt returns the expected conflict and leaves the first owner intact.
- Define release stop conditions using the project's baseline for request errors, latency, and queue health. Compare ownership conflicts with expected traffic because a conflict can be a successful check of the service contract.
- Before relying on rollback, verify that the previous revision can read and write the deployed schema and any active queued work. If it cannot, use the recovery procedure for that migration.

Record the revision, environment, check results, and how to confirm recovery. Use the release plan or runbook for production actions when the task authorizes them.
