---
title: title.exists
summary: "A page has a title element in its head. See what the title.exists rule checks, why it matters, and how to configure it."
---

A page has a `<title>` element in its `<head>`.

**Why:** Search engines show the title as the link text in results. Without one, they make up a title from the page content.

**When off:** pages without a title pass.

```html
<!-- ✗ Fails -->
<head></head>

<!-- ✓ Passes -->
<head>
  <title>Fresh bread every morning</title>
</head>
```
