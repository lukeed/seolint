---
title: robots.nofollow
summary: "A page does not ask search engines to ignore its links. See what the robots.nofollow rule checks, why it matters, and how to configure it."
---

A page does not ask search engines to ignore its links.

**Why:** `nofollow`, or `none`, stops search engines from following the page's links, so the pages it links to are found and ranked less.

**When off:** pages with `nofollow` pass.

```html
<!-- ✗ Fails -->
<meta name="robots" content="nofollow" />

<!-- ✓ Passes -->
<meta name="robots" content="index, follow" />
```
