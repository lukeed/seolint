---
title: site.robots
summary: "A robots.txt exists, and does not block every crawler. See what the site.robots rule checks, why it matters, and how to configure it."
---

A `robots.txt` exists, and does not block every crawler.

**Why:** Crawlers read `robots.txt` first. A missing file is fine for them, but often means it was left out of the build. A `Disallow: /` for `User-agent: *` blocks the whole site, which is often left over from a staging site.

**When off:** a missing or blocking `robots.txt` passes.

```txt
# ✗ Fails
User-agent: *
Disallow: /

# ✓ Passes
User-agent: *
Allow: /
```

## References

- [Google: Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro): What robots.txt does. A site can work without one, so the rule warns.
- [Google: How Google interprets robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt): How Google reads robots.txt, as seolint does.
- [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html): The robots.txt standard.
