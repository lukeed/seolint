---
title: link.internal.trailing
summary: "An internal link ends with a slash for a folder page, and without one for a file page. See what the link.internal.trailing rule checks."
---

An internal link ends with a slash for a folder page, and without one for a file page.

**Why:** `/about` and `/about/` are different URLs. A host serves a folder page, `about/index.html`, at `/about/`, and a file page, `about.html`, at `/about`. A link with the other form costs a redirect, or fails on some hosts, and both URLs may get indexed. Google sets no rule for trailing slashes, so the rule follows your build, not one style.

The rule reads the files of a linted folder, so it does not run for single files and URLs. Links to files with an extension, such as `/menu.pdf`, and links to pages that the build lacks, are skipped. The query and hash are ignored.

**When off:** links of either form pass.

```html
<!-- For a build with about/index.html -->

<!-- ✗ Fails -->
<a href="/about">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
<a href="/menu.pdf">Menu</a>
```

## References

- [Google: URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure): Google sets no rule for trailing slashes, so the rule follows the build.
- [Google: How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): Two URLs for one page split its signals.
