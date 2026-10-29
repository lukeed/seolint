---
title: viewport.exists
summary: "A page has a viewport meta tag. See what the viewport.exists rule checks, why it matters, and how to configure it."
---

A page has a `<meta name="viewport">` tag.

**Why:** Without it, phones show the page at desktop width, zoomed out. Search engines rank pages that are not mobile-friendly lower.

**When off:** pages without a viewport pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
```

## References

- [MDN: The viewport meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element): The viewport tag makes a page fit mobile screens.
- [Google: Mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing): Google indexes the mobile version of each page.
