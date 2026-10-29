---
title: heading.order
summary: "Headings start at h1 or h2, and do not skip levels. See what the heading.order rule checks, why it matters, and how to configure it."
---

Headings start at `<h1>` or `<h2>`, and do not skip levels, such as an `<h4>` after an `<h2>`.

**Why:** Skipped levels break the outline of the page, which search engines and screen readers use to understand how sections relate.

The outline holds every heading of the page, in order, including the headings of a sidebar or footer. The first heading can be an `<h2>`, such as a menu before the `<h1>`. A first heading of `<h3>` or lower skips levels, because the outline starts below its top.

**When off:** headings in any order pass.

```html
<!-- ✗ Fails -->
<h1>Our sourdough</h1>
<h3>Ingredients</h3>

<!-- ✗ Fails -->
<h4>Menu</h4>
<h1>Our sourdough</h1>

<!-- ✓ Passes -->
<h1>Our sourdough</h1>
<h2>Ingredients</h2>

<!-- ✓ Passes -->
<h2>Menu</h2>
<h1>Our sourdough</h1>
```
