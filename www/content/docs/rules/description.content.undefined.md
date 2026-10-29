---
title: description.content.undefined
summary: "The description does not include the word undefined. See what the description.content.undefined rule checks, why it matters, and how to configure it."
---

The description does not include the word `undefined`.

**Why:** `undefined` in a description is almost always a template bug, such as a missing variable.

**When off:** descriptions with `undefined` pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="undefined" />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

## References

- [Google: Snippets](https://developers.google.com/search/docs/appearance/snippet): A description should describe the page, so a template value such as "undefined" is a bug.
