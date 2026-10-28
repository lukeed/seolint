---
title: image.alt.content.undefined
summary: "The alt text does not include the word undefined. See what the image.alt.content.undefined rule checks, why it matters, and how to configure it."
---

The `alt` text does not include the word `undefined`.

**Why:** `undefined` in `alt` text is almost always a template bug, such as a missing variable.

**When off:** `alt` text with `undefined` passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="undefined" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```
