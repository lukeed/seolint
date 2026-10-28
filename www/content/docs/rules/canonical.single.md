---
title: canonical.single
summary: "A page has only one canonical link. See what the canonical.single rule checks, why it matters, and how to configure it."
---

A page has only one canonical link.

**Why:** With more than one canonical link, search engines may ignore all of them.

**When off:** pages with many canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/about/" />
<link rel="canonical" href="https://example.com/about-us/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```
