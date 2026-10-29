---
title: heading.single
summary: "A page has only one h1. See what the heading.single rule checks, why it matters, and how to configure it."
---

A page has only one `<h1>`.

**Why:** More than one `<h1>` makes the main topic of the page unclear, and MDN calls one `<h1>` a best practice.

The rule warns, and does not fail. Google says that a page can have more than one `<h1>`.

**When off:** pages with many `<h1>` elements pass.

```html
<!-- ✗ Fails -->
<h1>Contact us</h1>
<h1>Opening hours</h1>

<!-- ✓ Passes -->
<h1>Contact us</h1>
<h2>Opening hours</h2>
```

## References

- [MDN: Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements): MDN calls one `<h1>` per page a best practice.
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): Google sets no ideal number of headings, so the rule warns.
