---
title: image.alt.exists
summary: "An img has an alt attribute. See what the image.alt.exists rule checks, why it matters, and how to configure it."
---

An `<img>` has an `alt` attribute.

**Why:** Search engines and screen readers use `alt` text to understand images. An empty `alt=""` is allowed: it marks a decorative image that should be skipped.

**When off:** images without `alt` pass.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="A basket of fresh bread" />
<img src="/divider.svg" alt="" />
```

## References

- [Google: Image SEO best practices](https://developers.google.com/search/docs/appearance/google-images): Google calls a missing `alt` bad, and uses alt text to understand images.
- [WCAG 2.2: Understanding Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html): Images need a text alternative (Level A).
- [axe: image-alt](https://dequeuniversity.com/rules/axe/4.10/image-alt): The same check in axe-core.
