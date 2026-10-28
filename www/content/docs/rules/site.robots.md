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
