---
title: canonical.href.exists
summary: "The canonical link has a non-empty href. See what the canonical.href.exists rule checks, why it matters, and how to configure it."
---

The canonical link has a non-empty `href`.

**Why:** An empty canonical link points nowhere, and usually means a template left out a value.

**When off:** empty canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

## References

- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): A canonical link names a URL in its `href`.
