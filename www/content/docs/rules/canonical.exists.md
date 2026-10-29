---
title: canonical.exists
summary: "A page has a canonical link tag. See what the canonical.exists rule checks, why it matters, and how to configure it."
---

A page has a `<link rel="canonical">` tag.

**Why:** The same page is often reachable at many URLs, such as with tracking parameters. The canonical link tells search engines which URL to show, so the others do not compete with it.

**When off:** pages without a canonical link pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <link rel="canonical" href="https://example.com/about/" />
</head>
```

## References

- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): A canonical link is a strong signal, and Google recommends one on each canonical page, itself included.
