---
title: link.internal.nofollow
summary: 'An internal link does not use rel="nofollow". See what the link.internal.nofollow rule checks, why it matters, and how to configure it.'
---

An internal link does not use `rel="nofollow"`.

**Why:** `nofollow` on your own links stops search engines from following them, so your own pages are found and ranked less.

**When off:** internal `nofollow` links pass.

```html
<!-- ✗ Fails -->
<a href="/about/" rel="nofollow">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

## References

- [Google: Qualify your outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links): `nofollow` is for links that you do not trust. Use robots.txt, not `nofollow`, to keep Google away from your own pages.
