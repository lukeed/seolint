---
title: title.single
summary: "A page has only one title element. See what the title.single rule checks, why it matters, and how to configure it."
---

A page has only one `<title>` element.

**Why:** With more than one title, search engines pick one, and may not pick the one you want.

**When off:** pages with many titles pass.

```html
<!-- ✗ Fails -->
<title>Home</title>
<title>Bongo Bakery</title>

<!-- ✓ Passes -->
<title>Bongo Bakery</title>
```

## References

- [HTML spec: The title element](https://html.spec.whatwg.org/multipage/semantics.html#the-title-element): A document has at most one `<title>` element.
