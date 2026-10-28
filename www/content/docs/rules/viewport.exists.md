---
title: viewport.exists
summary: "A page has a viewport meta tag. See what the viewport.exists rule checks, why it matters, and how to configure it."
---

A page has a `<meta name="viewport">` tag.

**Why:** Without it, phones show the page at desktop width, zoomed out. Search engines rank pages that are not mobile-friendly lower.

**When off:** pages without a viewport pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
```
