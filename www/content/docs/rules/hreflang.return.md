---
title: hreflang.return
summary: "A page that an hreflang link points to links back to the page. See what the hreflang.return rule checks, why it matters, and how to configure it."
---

A page that an `hreflang` link points to links back to the page.

**Why:** Google ignores `hreflang` links between two pages unless both pages point to each other. A version that forgets to link back cuts the pair apart.

The rule compares the pages that seolint lints, by their URL, so it needs a [`host`](/docs/config/#host). Links to pages outside the lint, such as another domain, are skipped.

**When off:** one-way `hreflang` links pass.

```html
<!-- On https://example.com/en/ -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/" />

<!-- On https://example.com/fr/: ✗ Fails, because it does not link to /en/ -->
<link rel="alternate" hreflang="fr" href="https://example.com/fr/" />

<!-- On https://example.com/fr/: ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/" />
```
