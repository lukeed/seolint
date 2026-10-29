---
title: site.sitemap.entries
summary: "A sitemap lists only https pages of the build that search engines can index and crawl. See what the site.sitemap.entries rule checks."
---

A sitemap lists only `https` pages of the build that search engines can index and crawl.

**Why:** A sitemap suggests the URLs that you want in search results. Google asks for canonical URLs only, and not the `http` version of a page. A listed URL that is missing, that has `noindex`, that has a canonical link to another URL, or that `robots.txt` blocks sends mixed signals, and wastes crawls.

The rule reads the same sitemaps as [`site.sitemap`](/docs/rules/site.sitemap/). It skips URLs on other origins, and needs a [`host`](/docs/config/#host) to find the page of each URL.

**When off:** a sitemap can list any URL.

```xml
<!-- ✗ Fails, for a site where /draft/ has noindex -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>http://example.com/</loc></url>
	<url><loc>https://example.com/draft/</loc></url>
</urlset>

<!-- ✓ Passes -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>https://example.com/</loc></url>
</urlset>
```
