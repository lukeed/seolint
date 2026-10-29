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

## References

- [Google: Robots meta tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): A page that robots.txt blocks is not crawled, so its `noindex` is never seen.
- [Google: Block search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing): For `noindex` to work, robots.txt must not block the page.
- [Google: How Google interprets robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt): How Google reads robots.txt, as seolint does.
