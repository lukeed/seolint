---
title: hreflang.self
summary: "Pages with hreflang links also link to themselves. See what the hreflang.self rule checks, why it matters, and how to configure it."
---

Pages with `hreflang` links also link to themselves.

**Why:** Google asks each language version to list itself as well as every other version. The rule needs the page URL, so it is skipped without a [`host`](/docs/config/#host).

**When off:** pages that do not list themselves pass.

```html
<!-- On https://example.com/en/ -->

<!-- ✗ Fails -->
<link rel="alternate" hreflang="fr" href="https://example.com/fr/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/" />
```
