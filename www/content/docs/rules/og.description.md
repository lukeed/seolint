---
title: og.description
summary: "A page has an og:description. See what the og.description rule checks, why it matters, and how to configure it."
---

A page has an `og:description`.

**Why:** Link previews show the `og:description` below the title.

**When off:** pages without `og:description` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:description" content="Who we are, and how we bake." />
</head>
```

## References

- [The Open Graph protocol](https://ogp.me/): `og:description` describes the page in link previews. The rule warns.
