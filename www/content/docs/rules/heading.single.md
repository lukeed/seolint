---
title: heading.single
summary: "A page has only one h1. See what the heading.single rule checks, why it matters, and how to configure it."
---

A page has only one `<h1>`.

**Why:** More than one `<h1>` makes the main topic of the page unclear.

**When off:** pages with many `<h1>` elements pass.

```html
<!-- ✗ Fails -->
<h1>Contact us</h1>
<h1>Opening hours</h1>

<!-- ✓ Passes -->
<h1>Contact us</h1>
<h2>Opening hours</h2>
```
