---
title: og.title
summary: "A page has an og:title. See what the og.title rule checks, why it matters, and how to configure it."
---

A page has an `og:title`.

**Why:** Link previews show the `og:title` as their heading. Without it, apps guess from the page.

**When off:** pages without `og:title` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:title" content="About Bongo Bakery" />
</head>
```
