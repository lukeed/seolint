---
title: heading.exists
summary: "A page has an h1. See what the heading.exists rule checks, why it matters, and how to configure it."
---

A page has an `<h1>`.

**Why:** The `<h1>` names the main topic of the page. Search engines and screen readers rely on it.

**When off:** pages without an `<h1>` pass.

```html
<!-- ✗ Fails -->
<body>
  <h2>Our bread</h2>
</body>

<!-- ✓ Passes -->
<body>
  <h1>Our bread</h1>
</body>
```
