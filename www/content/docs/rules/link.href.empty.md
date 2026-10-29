---
title: link.href.empty
summary: "A link href is not empty. See what the link.href.empty rule checks, why it matters, and how to configure it."
---

A link `href` is not empty.

**Why:** An empty `href` points back to the same page, which is almost always a template bug.

**When off:** empty links pass.

```html
<!-- ✗ Fails -->
<a href="">Menu</a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
```

## References

- [Google: Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): Google crawls links by their `href`, so an empty one leads nowhere.
