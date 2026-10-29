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

## References

- [Google: Snippets](https://developers.google.com/search/docs/appearance/snippet): Google recommends a description at least for important pages, and uses it for snippets.
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): A good description is short, unique, and relevant.
