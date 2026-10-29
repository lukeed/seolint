---
title: link.internal.https
summary: "An internal link uses https://, or a root-relative path. See what the link.internal.https rule checks, why it matters, and how to configure it."
---

An internal link uses `https://`, or a root-relative path.

**Why:** An `http://` link to your own site forces a redirect to `https://`, or serves an insecure page.

**When off:** internal `http://` links pass.

```html
<!-- ✗ Fails -->
<a href="http://example.com/about/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

## References

- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): Google prefers HTTPS URLs, and a link to an HTTP URL costs a redirect.
- [Google: Page experience](https://developers.google.com/search/docs/appearance/page-experience): Pages should be served over HTTPS.
