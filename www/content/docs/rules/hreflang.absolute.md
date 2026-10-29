---
title: hreflang.absolute
summary: "An hreflang link uses an absolute URL. See what the hreflang.absolute rule checks, why it matters, and how to configure it."
---

An `hreflang` link uses an absolute URL.

**Why:** Search engines require absolute URLs in alternate links.

**When off:** relative alternate links pass.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="en" href="/en/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
```

## References

- [Google: Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions): Alternate URLs must be fully qualified.
