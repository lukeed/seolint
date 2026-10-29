---
title: image.alt.content.html
summary: "The alt text has no HTML tags. See what the image.alt.content.html rule checks, why it matters, and how to configure it."
---

The `alt` text has no HTML tags.

**Why:** `alt` holds plain text. Tags in it are read out as literal text.

Only the tags of HTML elements, comments, and declarations count. `alt` text can name a tag that no HTML element has, such as `<my-element>`.

**When off:** `alt` text with tags passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="&lt;b&gt;Bread&lt;/b&gt;" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```
