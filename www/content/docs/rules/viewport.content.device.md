---
title: viewport.content.device
summary: "The viewport content includes width=device-width. See what the viewport.content.device rule checks, why it matters, and how to configure it."
---

The viewport `content` includes `width=device-width`.

**Why:** Without `width=device-width`, phones lay out the page at a fixed width instead of the screen width.

**When off:** viewports without it pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="initial-scale=1" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
