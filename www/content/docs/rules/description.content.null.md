---
title: description.content.null
summary: "The description does not include the word null. See what the description.content.null rule checks, why it matters, and how to configure it."
---

The description does not include the word `null`.

**Why:** `null` in a description is almost always a template bug, such as an empty value.

**When off:** descriptions with `null` pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="null" />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```
