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

## References

- [Google: Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): Google uses link text, and the `alt` of an image link, to understand the target.
- [WCAG 2.2: Understanding Link Purpose (In Context)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html): A link needs text that says where it goes (Level A).
- [axe: link-name](https://dequeuniversity.com/rules/axe/4.10/link-name): The same check in axe-core.
