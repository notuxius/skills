# Developer exercise

**Task prompt**

> Agents sometimes see the wrong tickets after changing filters or refreshing twice. Implement the queue view in `frontend/queue-view.mjs`. Preserve the last successful rows on a same-filter retry, show empty results distinctly from loading, and make the final view reflect the user's most recent request.

The module exports `createQueueView(load)`. The loader accepts a filter and returns a promise for an array of ticket IDs. The view exposes `refresh(filter)` and `snapshot()`. Each snapshot includes `filter`, `phase` (`idle`, `loading`, `ready` or `error`), `rows` and `error`. A caught loader failure is presented as its message.

The checked-in implementation is a passing reference. For a fresh evaluation, use a disposable copy, remove only `frontend/queue-view.mjs`, and give the task prompt to the developer agent. Run the existing acceptance tests from the repository root.

```sh
node --test frontend/queue-view.test.mjs
```
