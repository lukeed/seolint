---
title: hreflang.code
summary: "An hreflang value is a valid language code, or x-default. See what the hreflang.code rule checks, why it matters, and how to configure it."
---

An `hreflang` value is a valid language code, or `x-default`.

**Why:** Search engines ignore alternate links with an invalid code, such as `english`. A code is an ISO 639-1 language, with an optional ISO 15924 script and ISO 3166-1 region, such as `en`, `zh-Hant`, or `pt-BR`. Google does not support other codes, such as the reserved region `UK` (use `GB`), or the numeric region in `es-419`.

**When off:** any `hreflang` value passes.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="english" href="https://example.com/en/" />
<link rel="alternate" hreflang="en-UK" href="https://example.com/uk/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="en-GB" href="https://example.com/uk/" />
```
