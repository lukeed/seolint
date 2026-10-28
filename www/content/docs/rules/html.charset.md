---
title: html.charset
summary: "A page declares its character encoding near the top. See what the html.charset rule checks, why it matters, and how to configure it."
---

A page declares its character encoding near the top.

**Why:** Without a declared encoding, browsers and crawlers guess, and can show text as garbled characters. The HTML spec requires the declaration within the first 1024 bytes, so this rule also fails when it comes later.

**When off:** pages without, or with a late, encoding pass.

```html
<!-- ✗ Fails -->
<head>
  <title>Home</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta charset="utf-8" />
  <title>Home</title>
</head>
```
