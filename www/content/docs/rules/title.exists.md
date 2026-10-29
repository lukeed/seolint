---
title: title.exists
summary: "A page has a title element in its head. See what the title.exists rule checks, why it matters, and how to configure it."
---

A page has a `<title>` element in its `<head>`.

**Why:** Search engines show the title as the link text in results. Without one, they make up a title from the page content.

**When off:** pages without a title pass.

```html
<!-- ✗ Fails -->
<head></head>

<!-- ✓ Passes -->
<head>
  <title>Fresh bread every morning</title>
</head>
```

## References

- [Google: Title links](https://developers.google.com/search/docs/appearance/title-link): Every page needs a `<title>`.
- [WCAG 2.2: Understanding Page Titled](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html): Pages need titles that describe them (Level A).
- [axe: document-title](https://dequeuniversity.com/rules/axe/4.10/document-title): The same check in axe-core.
