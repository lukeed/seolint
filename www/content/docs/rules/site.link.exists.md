---
title: site.link.exists
summary: "Internal links point to files that exist in the build. See what the site.link.exists rule checks, why it matters, and how to configure it."
---

Internal links point to files that exist in the build.

**Why:** Broken links waste crawl time, lose the value they would pass on, and frustrate visitors. A link to `/about/` passes when `about/index.html` exists. A link to `/about` passes when `about`, `about/index.html`, or `about.html` exists. The query and hash are ignored.

**When off:** broken internal links pass.

```html
<!-- ✗ Fails, when there is no menu/index.html -->
<a href="/menu/">Menu</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```
