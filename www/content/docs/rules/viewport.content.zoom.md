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

## References

- [WCAG 2.2: Understanding Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): Users must be able to zoom text to 200% (Level AA).
- [axe: meta-viewport](https://dequeuniversity.com/rules/axe/4.10/meta-viewport): The same check in axe-core, with the same limit of 2.
