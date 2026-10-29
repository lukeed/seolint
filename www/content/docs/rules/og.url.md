---
title: og.url
summary: "A page has an og:url that matches its canonical URL. See what the og.url rule checks, why it matters, and how to configure it."
---

A page has an `og:url` that matches its canonical URL.

**Why:** Apps use `og:url` to group shares of the same page. When it differs from the canonical URL, shares of one page are counted apart. Without a canonical link, the rule compares against the page URL, when it is known.

**When off:** pages without, or with a different, `og:url` pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/about/" />
<meta property="og:url" content="https://example.com/about-us/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
<meta property="og:url" content="https://example.com/about/" />
```

## References

- [The Open Graph protocol](https://ogp.me/): `og:url` is the canonical URL of the page. The rule warns.
- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): The canonical URL that `og:url` should match.
