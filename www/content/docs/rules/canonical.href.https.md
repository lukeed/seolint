---
title: canonical.href.https
summary: "The canonical href uses https://. See what the canonical.href.https rule checks, why it matters, and how to configure it."
---

The canonical `href` uses `https://`.

**Why:** Search engines prefer `https://` pages. A canonical link to `http://` asks them to show the insecure version.

**When off:** `http://` canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="http://example.com/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

## References

- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): Google prefers HTTPS pages over HTTP pages as canonical.
