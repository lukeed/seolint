---
title: description.content.html
summary: "The description has no HTML tags in its text. See what the description.content.html rule checks, why it matters, and how to configure it."
---

The description has no HTML tags in its text.

**Why:** A description holds plain text. Tags in it, such as an escaped `&lt;b&gt;`, show up as literal text in search results.

**When off:** descriptions with tags pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="Our &lt;b&gt;best&lt;/b&gt; bread." />

<!-- ✓ Passes -->
<meta name="description" content="Our best bread." />
```
