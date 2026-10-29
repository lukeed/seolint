---
title: title.content.html
summary: "The title has no HTML tags in its text. See what the title.content.html rule checks, why it matters, and how to configure it."
---

The title has no HTML tags in its text.

**Why:** A `<title>` holds plain text. Tags inside it show up as literal text, such as `<b>`, in search results and browser tabs. Entities such as `&amp;` are fine.

Only the tags of HTML elements, comments, and declarations count. A title can name a tag that no HTML element has, such as `<svelte:head>` or `<my-element>`.

**When off:** titles with tags pass.

```html
<!-- ✗ Fails -->
<title>Fresh <b>bread</b></title>

<!-- ✓ Passes -->
<title>Fish &amp; Chips</title>
<title>The &lt;svelte:head&gt; element</title>
```

## References

- [HTML spec: The title element](https://html.spec.whatwg.org/multipage/semantics.html#the-title-element): The title is plain text.
- [Google: Title links](https://developers.google.com/search/docs/appearance/title-link): Google uses the title text for the title link in results.
