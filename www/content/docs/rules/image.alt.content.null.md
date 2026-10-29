---
title: image.alt.content.null
summary: "The alt text does not include the word null. See what the image.alt.content.null rule checks, why it matters, and how to configure it."
---

The `alt` text does not include the word `null`.

**Why:** `null` in `alt` text is almost always a template bug, such as an empty value.

**When off:** `alt` text with `null` passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="null" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```

## References

- [Google: Image SEO best practices](https://developers.google.com/search/docs/appearance/google-images): Alt text should describe the image, so a template value such as "null" is a bug.
