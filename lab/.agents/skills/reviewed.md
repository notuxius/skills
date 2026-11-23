# Project skill coverage

```yaml
groups:
  developer: [queue-ui]
  backend: [queue-api]
  aqa: [queue-aqa]
  designer: [queue-design]
```

| Workspace | Package or runtime workflow | Requirement | Project skill | Evidence and verification |
|---|---|---|---|---|
| `frontend/` | Promises and request ordering | Node.js >=22.20.0 | `queue-ui` | `frontend/queue-view.test.mjs` covers overlapping refreshes. |
| `backend/` | Web Request and Response APIs | Node.js >=22.20.0 | `queue-api` | `backend/claim.test.mjs` checks claims, retries, conflicts and persisted ownership. |
| `qa/` | node:test and strict assertions | Node.js >=22.20.0 | `queue-aqa` | `qa/claim-race.test.mjs` runs the check against a working and a faulty service. |
| `design/` | JSON design tokens consumed by the badge component | Node.js >=22.20.0 | `queue-design` | `design/status-badge.test.mjs` checks labels, contrast and fallback semantics. |

The runtime requirement comes from `package.json`. Record the exact resolved dependency and its workspace here when the project introduces a package that affects a role.
