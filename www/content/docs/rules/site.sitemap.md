---
title: site.sitemap
summary: "A sitemap exists, and lists every page. See what the site.sitemap rule checks, why it matters, and how to configure it."
---

A sitemap exists, and lists every page.

**Why:** A sitemap helps search engines find every page, including pages that few links point to. A page missing from it may be found late, or not at all. seolint reads the sitemaps that the `Sitemap:` lines of `robots.txt` name, or else `sitemap.xml`. It follows sitemap index files, and reads gzipped sitemaps. Pages are matched by their URL, from the `host` and the file path. URLs of one page match, with or without `index.html` or `.html`, because hosts serve `about.html` at `/about` too.

**When off:** a missing sitemap, or missing pages, pass.

```xml
<!-- ✓ Passes, for a site with these two pages -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>https://example.com/</loc></url>
	<url><loc>https://example.com/about/</loc></url>
</urlset>
```
