# Project skill coverage

```yaml
groups:
  developer: [queue-ui]
  backend: [queue-api]
  aqa: [queue-aqa]
  designer: [queue-design]
```

| Workspace | Package or runtime workflow | Project minimum | Last verified | Project skill | Verification |
|---|---|---|---|---|---|
| `frontend/` | Node.js promises and request ordering | 22.20.0 | 26.13.1 | `queue-ui` | `node --test frontend/queue-view.test.mjs` passed overlapping refresh and retry checks. |
| `backend/` | Node.js Web Request and Response APIs | 22.20.0 | 26.13.1 | `queue-api` | `node --test backend/claim.test.mjs` passed claim, retry, conflict and readback checks. |
| `qa/` | `node:test` and strict assertions | 22.20.0 | 26.13.1 | `queue-aqa` | `node --test qa/claim-race.test.mjs` passed and detected wrong ownership in the faulty service. |
| `design/` | JSON design tokens consumed by the badge component | 22.20.0 | 26.13.1 | `queue-design` | `node --test design/status-badge.test.mjs` passed label, contrast and fallback checks. |

The project minimum comes from `package.json`. Record the resolved dependency, minimum supported version when known, and the last verified version separately when a package affects a role.
