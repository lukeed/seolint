---
title: site.description.unique
summary: "Every page has a different description. See what the site.description.unique rule checks, why it matters, and how to configure it."
---

Every page has a different description.

**Why:** A description that repeats across pages tells search engines nothing about each page, so they often replace it with page text. Case is ignored.

Pages with `noindex`, or with a canonical link to another URL, are left out, because search engines do not show them as themselves.

**When off:** duplicate descriptions pass.

```html
<!-- ✗ Fails -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Fresh bread every morning." />

<!-- ✓ Passes -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Call, write, or visit us." />
```

## References

- [Google: Snippets](https://developers.google.com/search/docs/appearance/snippet): Identical or similar descriptions on many pages are not helpful.
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): A good description is unique to one page.
