---
title: viewport.single
summary: "A page has only one viewport tag. See what the viewport.single rule checks, why it matters, and how to configure it."
---

A page has only one viewport tag.

**Why:** With more than one viewport tag, browsers use only one, which may not be the one you want.

**When off:** pages with many viewport tags pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="width=device-width" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## References

- [MDN: The viewport meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element): How the viewport tag works. Two tags can set different values, so the page may not render as you expect.
