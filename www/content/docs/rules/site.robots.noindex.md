---
title: site.robots.noindex
summary: "robots.txt does not block a page with noindex, so search engines see it. See what the site.robots.noindex rule checks, and why it matters."
---

`robots.txt` does not block a page with `noindex`, so search engines see it.

**Why:** A crawler does not fetch a page that `robots.txt` blocks, so it never sees the page's `noindex`. Google can still show the URL in results, from links to it. To keep a page out of results, Google asks you to let it be crawled, and to use `noindex`.

The rule reads the `robots.txt` of a linted folder, as Google reads it, and needs a [`host`](/docs/config/#host) for the page paths.

**When off:** blocked pages with `noindex` pass.

```txt
# ✗ Fails, when /private/ pages have noindex
User-agent: *
Disallow: /private/
```
