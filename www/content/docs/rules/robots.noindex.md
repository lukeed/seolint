---
title: robots.noindex
summary: "A page does not ask search engines to leave it out of results. See what the robots.noindex rule checks, why it matters, and how to configure it."
---

A page does not ask search engines to leave it out of results.

**Why:** `noindex`, or `none`, removes the page from search results. It is often left over from a staging site.

The rule reads the `robots` and `googlebot` meta tags. For a URL, it also reads the `X-Robots-Tag` header, with its unscoped and `googlebot:` directives.

**When off:** pages with `noindex` pass. Turn the rule off for sites, or pages, that you do not want in search results.

```html
<!-- ✗ Fails -->
<meta name="robots" content="noindex" />

<!-- ✓ Passes -->
<meta name="robots" content="index, follow" />
```
