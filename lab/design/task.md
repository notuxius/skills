# Designer exercise

**Task prompt**

> Prepare the support queue's status-badge handoff in `design/status-tokens.json`. Agents must be able to read the ticket state in light and dark themes. Keep a new server state understandable even before the design team has assigned it a badge. Follow the product brief below.

| Design decision | Product brief |
|---|---|
| Approved labels | Open, Waiting, Resolved |
| Unrecognized or missing status | Display “Status unavailable” using its own neutral surface and text. The neutral palette allows at most 16 levels of difference between RGB channels. |
| Themes | Dark text on light surfaces in light mode and light text on dark surfaces in dark mode |
| Contrast | At least 4.5:1 between each badge's text and surface |
| Delivery | Opaque six-digit hex colors in the existing component's JSON format |

The component in `design/status-badge.mjs` reads `statuses.open`, `statuses.waiting`, `statuses.resolved` and `fallback`. Every token has a visible `label` and two theme objects, `light` and `dark`, each with `text` and `surface` colors. Choose the colors within the brief.

The checked-in handoff is a passing reference. For a fresh evaluation, use a disposable copy, remove only `design/status-tokens.json`, and give this task and brief to the designer agent. Run the existing acceptance tests from the repository root.

```sh
node --test design/status-badge.test.mjs
```
