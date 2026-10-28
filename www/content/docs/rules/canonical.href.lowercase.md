---
title: canonical.href.lowercase
summary: "The canonical href has no uppercase letters. See what the canonical.href.lowercase rule checks, why it matters, and how to configure it."
---

The canonical `href` has no uppercase letters.

**Why:** URL paths are case-sensitive, so `/About/` and `/about/` are different URLs. Lowercase URLs avoid two versions of one page.

**When off:** canonical links with uppercase letters pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/About/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```
