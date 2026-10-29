---
title: site.canonical.exists
summary: "A canonical link to the site points to a page of the build. See what the site.canonical.exists rule checks, why it matters, and how to configure it."
---

A canonical link to the site points to a page of the build.

**Why:** A canonical link asks search engines to show its target instead of the page. When the target does not exist, the page points search engines to an error page, and they may ignore the canonical link. This is often a renamed page, or a typo in a template.

The rule reads the files of a linted folder, so it does not run for single files and URLs, and it needs a [`host`](/docs/config/#host). Canonical links to other origins are skipped.

**When off:** canonical links to missing pages pass.

```html
<!-- For a build without old/index.html -->

<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/old/" />
```

## References

- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): A canonical link points search engines to the page to show, so it must exist.
