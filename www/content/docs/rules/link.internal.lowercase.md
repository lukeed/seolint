---
title: link.internal.lowercase
summary: "An internal link has no uppercase letters. See what the link.internal.lowercase rule checks, why it matters, and how to configure it."
---

An internal link has no uppercase letters.

**Why:** URL paths are case-sensitive, so `/About/` and `/about/` are different URLs, and one of them may not exist.

The rule warns, and does not fail. Google asks for one case, not for lowercase. A link with the wrong case to a page of the build fails [`site.link.exists`](/docs/rules/site.link.exists/).

**When off:** links with uppercase letters pass.

```html
<!-- ✗ Fails -->
<a href="/About/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

## References

- [Google: URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure): URLs are case-sensitive. Google asks for one case, not for lowercase, so the rule warns.
