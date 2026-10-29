---
title: viewport.content.scale
summary: "The viewport content includes initial-scale=1. See what the viewport.content.scale rule checks, why it matters, and how to configure it."
---

The viewport `content` includes `initial-scale=1`.

**Why:** Without `initial-scale=1`, some phones zoom the page when it loads, or when the device turns.

**When off:** viewports without it pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="width=device-width" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## References

- [MDN: The viewport meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element): `initial-scale=1` sets the zoom when the page loads.
