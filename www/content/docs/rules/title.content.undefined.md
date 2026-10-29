---
title: title.content.undefined
summary: "The title does not include the word undefined. See what the title.content.undefined rule checks, why it matters, and how to configure it."
---

The title does not include the word `undefined`.

**Why:** `undefined` in a title is almost always a template bug, such as a missing variable.

**When off:** titles with `undefined` pass.

```html
<!-- ✗ Fails -->
<title>undefined | Bongo Bakery</title>

<!-- ✓ Passes -->
<title>About | Bongo Bakery</title>
```

## References

- [Google: Title links](https://developers.google.com/search/docs/appearance/title-link): A title should describe the page, so a template value such as "undefined" is a bug.
