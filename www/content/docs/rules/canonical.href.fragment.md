---
title: canonical.href.fragment
summary: "The canonical href has no #fragment. See what the canonical.href.fragment rule checks, why it matters, and how to configure it."
---

The canonical `href` has no `#fragment`.

**Why:** Google ignores fragments in URLs, and asks you not to use one in a canonical URL. A fragment there is often a copied link to a section, such as `#top`.

**When off:** canonical links with a fragment pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/about/#team" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```
