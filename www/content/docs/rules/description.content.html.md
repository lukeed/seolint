---
title: description.content.html
summary: "The description has no HTML tags in its text. See what the description.content.html rule checks, why it matters, and how to configure it."
---

The description has no HTML tags in its text.

**Why:** A description holds plain text. Tags in it, such as an escaped `&lt;b&gt;`, show up as literal text in search results.

Only the tags of HTML elements, comments, and declarations count. A description can name a tag that no HTML element has, such as `<svelte:head>` or `<my-element>`.

**When off:** descriptions with tags pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="Our &lt;b&gt;best&lt;/b&gt; bread." />

<!-- ✓ Passes -->
<meta name="description" content="Our best bread." />
<meta name="description" content="How &lt;svelte:head&gt; works." />
```
