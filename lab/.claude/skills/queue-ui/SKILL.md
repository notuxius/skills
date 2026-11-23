---
name: queue-ui
description: Implement or review a support queue's client-side list, filter, loading and retry behavior. Use when a developer changes how agent-facing queue data is fetched or displayed.
---

# Queue UI

Trace the filter control through the loader to the list view. Identify which response owns each visible row and which state the view reads while loading. Preserve the project's existing component or state-store interface.

- Store the active filter and expose a pending state as soon as a request starts.
- Clear the prior error when retrying. An empty successful result should reach the ready state so the view can show its empty message.
- On failure, expose an actionable error for the active filter. Keep rows from an earlier successful request visible only if they belong to the same filter.
- Test the state that the view actually reads. Control the loader's promise resolution from the test to exercise pending, success and failure without sleeps.
