---
title: heading.order
summary: "Headings start at h1 or h2, and do not skip levels. See what the heading.order rule checks, why it matters, and how to configure it."
---

Headings start at `<h1>` or `<h2>`, and do not skip levels, such as an `<h4>` after an `<h2>`.

**Why:** Skipped levels break the outline of the page. Screen readers list the outline, so their users can see how sections relate and jump between them. Search engines do not rank pages by heading order, so this rule is for accessibility.

The outline holds every heading of the page, in order, including the headings of a sidebar or footer. The first heading can be an `<h2>`, such as a menu before the `<h1>`. A first heading of `<h3>` or lower skips levels, because the outline starts below its top.

**When off:** headings in any order pass.

```html
<!-- ✗ Fails -->
<h1>Our sourdough</h1>
<h3>Ingredients</h3>

<!-- ✗ Fails -->
<h4>Menu</h4>
<h1>Our sourdough</h1>

<!-- ✓ Passes -->
<h1>Our sourdough</h1>
<h2>Ingredients</h2>

<!-- ✓ Passes -->
<h2>Menu</h2>
<h1>Our sourdough</h1>
```

## References

- [HTML spec: Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines-2): A heading must not be more than one level deeper than the heading before it.
- [W3C WAI: Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/): Skipped levels confuse users. A page can start with an `<h2>` before the `<h1>`.
- [MDN: Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements): Do not skip heading levels.
- [axe: heading-order](https://dequeuniversity.com/rules/axe/4.10/heading-order): The same check in axe-core, as a best practice.
- [axe-core: heading-order source](https://github.com/dequelabs/axe-core/blob/develop/lib/checks/navigation/heading-order-after.js): axe-core lets the first heading pass.
- [Lighthouse: Accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring): Lighthouse runs the same check.
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): Google Search does not care about heading order, so the rule warns.
- [Search Engine Journal: Google says fixing headings won't change rankings](https://www.searchenginejournal.com/google-says-fixing-headings-wont-change-rankings/526639/): Google says that fixing headings does not change rankings.
