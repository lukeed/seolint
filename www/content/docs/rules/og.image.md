---
title: og.image
summary: "A page has an og:image. See what the og.image rule checks, why it matters, and how to configure it."
---

A page has an `og:image`.

**Why:** Link previews with an image get more attention than plain links.

**When off:** pages without `og:image` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:image" content="https://example.com/og/about.png" />
</head>
```

## References

- [The Open Graph protocol](https://ogp.me/): `og:image` is a required property. It only affects link previews, so the rule warns.
