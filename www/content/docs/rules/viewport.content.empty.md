---
title: viewport.content.empty
summary: "The viewport content is not empty. See what the viewport.content.empty rule checks, why it matters, and how to configure it."
---

The viewport `content` is not empty.

**Why:** An empty viewport is the same as no viewport.

**When off:** empty viewports pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## References

- [MDN: The viewport meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element): An empty viewport tag has no effect.
