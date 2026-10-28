---
title: heading.order
summary: "Headings do not skip levels, such as an h4 after an h2. See what the heading.order rule checks, why it matters, and how to configure it."
---

Headings do not skip levels, such as an `<h4>` after an `<h2>`.

**Why:** Skipped levels break the outline of the page, which search engines and screen readers use to understand how sections relate.

**When off:** headings in any order pass.

```html
<!-- ✗ Fails -->
<h1>Our sourdough</h1>
<h3>Ingredients</h3>

<!-- ✓ Passes -->
<h1>Our sourdough</h1>
<h2>Ingredients</h2>
```
