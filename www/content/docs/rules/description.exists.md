---
title: description.exists
summary: "A page has a description meta tag. See what the description.exists rule checks, why it matters, and how to configure it."
---

A page has a `<meta name="description">` tag.

**Why:** Search engines often show the description below the title. Without one, they pick a piece of the page text, which may not describe the page well.

**When off:** pages without a description pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta
    name="description"
    content="Who we are, and how we bake our bread every morning."
  />
</head>
```
