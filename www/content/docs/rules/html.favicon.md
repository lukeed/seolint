---
title: html.favicon
summary: "A page links to a favicon. See what the html.favicon rule checks, why it matters, and how to configure it."
---

A page links to a favicon.

**Why:** Search results and browser tabs show the favicon next to your page. Without one, they show a generic icon. The rule accepts the `rel` values that Google supports: `icon`, `shortcut icon`, `apple-touch-icon`, and `apple-touch-icon-precomposed`.

**When off:** pages without a favicon pass.

```html
<!-- ✗ Fails -->
<head>
  <title>Home</title>
</head>

<!-- ✓ Passes -->
<head>
  <link rel="icon" href="/favicon.svg" />
</head>
```
