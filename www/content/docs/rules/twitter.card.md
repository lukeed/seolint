---
title: twitter.card
summary: "A page has a valid twitter:card. See what the twitter.card rule checks, why it matters, and how to configure it."
---

A page has a valid `twitter:card`.

**Why:** X, formerly Twitter, uses `twitter:card` to choose the layout of a link preview. Without a valid value, it shows a plain link. The valid values are `summary`, `summary_large_image`, `app`, and `player`.

**When off:** pages without, or with an invalid, `twitter:card` pass.

```html
<!-- ✗ Fails -->
<meta name="twitter:card" content="big" />

<!-- ✓ Passes -->
<meta name="twitter:card" content="summary_large_image" />
```
