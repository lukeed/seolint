---
title: og.image.secure
summary: "The og:image is an absolute https:// URL. See what the og.image.secure rule checks, why it matters, and how to configure it."
---

The `og:image` is an absolute `https://` URL.

**Why:** Many apps only load preview images from absolute `https://` URLs, so a relative or `http://` image does not show.

**When off:** any `og:image` URL passes.

```html
<!-- ✗ Fails -->
<meta property="og:image" content="/og/about.png" />

<!-- ✓ Passes -->
<meta property="og:image" content="https://example.com/og/about.png" />
```
