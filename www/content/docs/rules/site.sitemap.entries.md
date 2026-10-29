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

## References

- [Google: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): List the canonical URLs that you want in results, and not the HTTP version of a page.
- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): All pages in a sitemap are suggested as canonical.
- [Google: Robots meta tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): A page with `noindex` stays out of results, so a sitemap should not suggest it. The rule warns.
