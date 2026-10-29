---
title: description.content.empty
summary: "The description is not empty. See what the description.content.empty rule checks, why it matters, and how to configure it."
---

The description is not empty.

**Why:** An empty description is the same as no description, and usually means a template left out a value.

**When off:** empty descriptions pass.

```html
<!-- ✗ Fails -->
<meta name="description" content=" " />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

## References

- [Google: Snippets](https://developers.google.com/search/docs/appearance/snippet): An empty description gives Google nothing to use for a snippet.
