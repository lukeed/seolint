---
title: site.sitemap
summary: "A sitemap.xml exists, and lists every page. See what the site.sitemap rule checks, why it matters, and how to configure it."
---

A `sitemap.xml` exists, and lists every page.

**Why:** A sitemap helps search engines find every page, including pages that few links point to. A page missing from it may be found late, or not at all. Pages are matched by their URL, from the `host` and the file path.

**When off:** a missing sitemap, or missing pages, pass.

```xml
<!-- ✓ Passes, for a site with these two pages -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>https://example.com/</loc></url>
	<url><loc>https://example.com/about/</loc></url>
</urlset>
```
