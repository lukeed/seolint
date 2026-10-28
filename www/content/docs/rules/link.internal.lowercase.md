---
title: link.internal.lowercase
summary: "An internal link has no uppercase letters. See what the link.internal.lowercase rule checks, why it matters, and how to configure it."
---

An internal link has no uppercase letters.

**Why:** URL paths are case-sensitive, so `/About/` and `/about/` are different URLs, and one of them may not exist.

**When off:** links with uppercase letters pass.

```html
<!-- ✗ Fails -->
<a href="/About/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```
