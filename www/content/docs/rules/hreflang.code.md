---
title: hreflang.code
summary: "An hreflang value is a valid language code, or x-default. See what the hreflang.code rule checks, why it matters, and how to configure it."
---

An `hreflang` value is a valid language code, or `x-default`.

**Why:** Search engines ignore alternate links with an invalid code, such as `english`. A code is a language, with an optional script and region, such as `en`, `zh-Hant`, or `pt-BR`.

**When off:** any `hreflang` value passes.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="english" href="https://example.com/en/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
```
