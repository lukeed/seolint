---
title: canonical.href.absolute
summary: "The canonical href is an absolute URL. See what the canonical.href.absolute rule checks, why it matters, and how to configure it."
---

The canonical `href` is an absolute URL.

**Why:** Search engines may resolve a relative canonical link differently than you expect, such as against another domain that serves the same page.

**When off:** relative canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```
