---
title: viewport.content.zoom
summary: "The viewport does not stop users from zooming. See what the viewport.content.zoom rule checks, why it matters, and how to configure it."
---

The viewport does not stop users from zooming.

**Why:** `user-scalable=no`, or a `maximum-scale` below 2, stops people from zooming in to read. This fails accessibility checks, such as Lighthouse.

**When off:** viewports that block zoom pass.

```html
<!-- ✗ Fails -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, user-scalable=no"
/>

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
