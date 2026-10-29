---
title: canonical.href.self
summary: "The canonical href points at the page itself. See what the canonical.href.self rule checks, why it matters, and how to configure it."
---

The canonical `href` points at the page itself.

**Why:** A canonical link to another page asks search engines to show that page instead of this one. That is right for duplicates, such as print versions, but is often a template mistake that hides real pages. The rule needs the page URL, so it is skipped without a `host`.

URLs of one page match, with or without `index.html` or `.html`, because hosts serve `about.html` at `/about` too.

**When off:** canonical links to other pages pass.

```html
<!-- On https://example.com/about/ -->

<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```
