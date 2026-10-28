---
title: link.blank.noreferrer
summary: 'A link with target="_blank" uses rel="noreferrer". See what the link.blank.noreferrer rule checks, why it matters, and how to configure it.'
---

A link with `target="_blank"` uses `rel="noreferrer"`.

**Why:** Without `noreferrer`, the opened page learns which page sent the visitor. `noreferrer` also implies `noopener` in older browsers.

**When off:** `target="_blank"` links without `noreferrer` pass.

```html
<!-- ✗ Fails -->
<a href="https://other.com/" target="_blank" rel="noopener">Recipe</a>

<!-- ✓ Passes -->
<a href="https://other.com/" target="_blank" rel="noopener noreferrer"
  >Recipe</a
>
```
