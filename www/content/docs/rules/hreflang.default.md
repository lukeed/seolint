---
title: hreflang.default
summary: "Pages with hreflang links also have an x-default link. See what the hreflang.default rule checks, why it matters, and how to configure it."
---

Pages with `hreflang` links also have an `x-default` link.

**Why:** `x-default` names the page to show visitors whose language matches none of the alternates.

**When off:** alternate links without `x-default` pass.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="de" href="https://example.com/de/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="de" href="https://example.com/de/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

## References

- [Google: Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions): Google recommends `x-default` for the fallback page, but does not require it, so the rule warns.
