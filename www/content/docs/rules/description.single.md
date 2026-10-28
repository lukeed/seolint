---
title: description.single
summary: "A page has only one description tag. See what the description.single rule checks, why it matters, and how to configure it."
---

A page has only one description tag.

**Why:** With more than one description, search engines pick one, and may not pick the one you want.

**When off:** pages with many descriptions pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="Our bakery." />
<meta name="description" content="Fresh bread every morning." />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```
