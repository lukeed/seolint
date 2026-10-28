---
title: link.internal.trailing
summary: "An internal link to a page ends with a slash. See what the link.internal.trailing rule checks, why it matters, and how to configure it."
---

An internal link to a page ends with a slash.

**Why:** `/about` and `/about/` are different URLs. One of them usually redirects to the other, which costs a request, and both may get indexed. A link to a file, with an extension such as `/menu.pdf`, is fine. The query and hash are ignored.

**When off:** links without a trailing slash pass.

```html
<!-- ✗ Fails -->
<a href="/about">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
<a href="/menu.pdf">Menu</a>
```
