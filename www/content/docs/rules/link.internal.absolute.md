---
title: link.internal.absolute
summary: "An internal link starts with /, //, or a protocol. See what the link.internal.absolute rule checks, why it matters, and how to configure it."
---

An internal link starts with `/`, `//`, or a protocol.

**Why:** A relative link, such as `about/`, resolves against the current page, so it breaks when the page moves.

The rule is off by default. Search engines follow relative links, and Google lists `./products/` as a crawlable link. Turn it on to keep every internal link root-relative.

**When off:** relative links pass.

```html
<!-- ✗ Fails -->
<a href="about/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```
