---
title: html.charset
summary: "A page declares the utf-8 encoding near the top. See what the html.charset rule checks, why it matters, and how to configure it."
---

A page declares the `utf-8` encoding near the top.

**Why:** Without a declared encoding, browsers and crawlers guess, and can show text as garbled characters. The HTML spec requires the declaration within the first 1024 bytes, so this rule also fails when it comes later. The spec also requires `utf-8`, the encoding that every browser supports.

**When off:** pages without an encoding, or with a late or other encoding, pass.

```html
<!-- ✗ Fails -->
<head>
  <title>Home</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta charset="utf-8" />
  <title>Home</title>
</head>
```

## References

- [HTML spec: Specifying the document's character encoding](https://html.spec.whatwg.org/multipage/semantics.html#charset): The declaration must be `utf-8`, and within the first 1024 bytes.
