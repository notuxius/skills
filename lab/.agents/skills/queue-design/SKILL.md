---
name: queue-design
description: Design or review the status-badge handoff for a support queue. Use when a designer specifies visible status labels, semantic tokens, light and dark palettes, and a fallback for new server states.
---

# Queue status design

Read the product's status vocabulary and theme contract before choosing colors. Deliver the mapping in the format consumed by the component so designers, developers and reviewers can inspect the same values.

- Give each supported status a short visible label and a named color pair for each supported theme. Use the product's wording and sentence case.
- Make the label carry the meaning when colors are unavailable. Keep text and background colors together so the renderer can use the intended pair.
- Check every badge's actual foreground and background in every theme against the contrast target in the design brief. Include the default badge in these checks.

## Handle unfamiliar statuses

Define one explicit fallback in the handoff. Give it a neutral palette and a visible label that acknowledges the missing status. Keep its wording distinct from an active or completed ticket. Preview an unfamiliar server value and a missing value in both themes. Check that neither inherits success styling or exposes an internal server identifier as user-facing text.
