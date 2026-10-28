---
title: link.text.exists
summary: "A link has text, an aria-label, or an image with alt text. See what the link.text.exists rule checks, why it matters, and how to configure it."
---

A link has text, an `aria-label`, or an image with `alt` text.

**Why:** Search engines use link text to learn what the target page is about, and screen readers read it aloud. A link without text says nothing.

**When off:** links without text pass.

```html
<!-- ✗ Fails -->
<a href="/menu/"><img src="/menu.svg" alt="" /></a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
<a href="/menu/" aria-label="Menu"><img src="/menu.svg" alt="" /></a>
```
