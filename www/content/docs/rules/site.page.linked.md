---
title: site.page.linked
summary: "Every page has a link from another page. See what the site.page.linked rule checks, why it matters, and how to configure it."
---

Every page has a link from another page.

**Why:** Search engines find pages by following links. Google asks that every page you care about has a link from at least one other page of your site. A page with no links to it, an orphan page, may be found late, or not at all, even when a sitemap lists it.

The rule reads the links of a linted folder, so it does not run for single files and URLs, and it needs a [`host`](/docs/config/#host). The home page, and pages with `noindex` or a canonical link to another URL, are skipped. A link from a page to itself does not count.

**When off:** pages without links to them pass.

```html
<!-- ✓ Passes: /about/ has a link from the home page -->
<!-- index.html -->
<a href="/about/">About</a>
```

## References

- [Google: Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): "Every page you care about should have a link from at least one other page on your site." A sitemap can still list the page, so the rule warns.
