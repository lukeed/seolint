---
title: link.href.exists
summary: "A link has an href attribute. See what the link.href.exists rule checks, why it matters, and how to configure it."
---

A link has an `href` attribute.

**Why:** An `<a>` without `href` is not a link, so search engines do not follow it, and keyboards cannot reach it.

**When off:** links without `href` pass.

```html
<!-- ✗ Fails -->
<a onclick="go()">Menu</a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
```
