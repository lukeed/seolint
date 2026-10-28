---
title: site.description.unique
summary: "Every page has a different description. See what the site.description.unique rule checks, why it matters, and how to configure it."
---

Every page has a different description.

**Why:** A description that repeats across pages tells search engines nothing about each page, so they often replace it with page text. Case is ignored.

**When off:** duplicate descriptions pass.

```html
<!-- ✗ Fails -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Fresh bread every morning." />

<!-- ✓ Passes -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Call, write, or visit us." />
```
