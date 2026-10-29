---
title: link.internal.pretty
summary: "An internal link does not end with .html. See what the link.internal.pretty rule checks, why it matters, and how to configure it."
---

An internal link does not end with `.html`.

**Why:** `/about.html` and `/about/` can both serve the same page, which splits its ranking. Clean URLs also read better in results.

The rule is off by default. Google sets no rule for file extensions in URLs, and a host serves `about.html` at `/about.html`. Turn it on to keep `.html` out of your links.

**When off:** links that end with `.html` pass.

```html
<!-- ✗ Fails -->
<a href="/about.html">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```
