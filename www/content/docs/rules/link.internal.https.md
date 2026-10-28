---
title: link.internal.https
summary: "An internal link uses https://, or a root-relative path. See what the link.internal.https rule checks, why it matters, and how to configure it."
---

An internal link uses `https://`, or a root-relative path.

**Why:** An `http://` link to your own site forces a redirect to `https://`, or serves an insecure page.

**When off:** internal `http://` links pass.

```html
<!-- ✗ Fails -->
<a href="http://example.com/about/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```
