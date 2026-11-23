# Claim a support ticket

> As the backend engineer, make claiming a ticket safe to retry. A second agent occasionally opens the same ticket and tries to claim it. Keep the first successful owner, return a useful conflict to the other agent, and show what both callers see through the API.

Use the installed skill that matches the task. The sample service handles standard `Request` objects in memory. Read a ticket at `GET /tickets/:id` and claim it at `POST /tickets/:id/claim` using a JSON body with `agentId`. Tickets contain `id`, `title` and `assignee`.

Run the backend contract tests from the project root.

```sh
node --test backend/claim.test.mjs
```

The default checkout includes the working reference. To practice a repair, work in a disposable checkout and remove the ownership guard from `backend/queue.mjs`. Confirm the competing-claim test fails, complete the task and run the suite again. Report the initial claim, retry, conflict and final owner.
