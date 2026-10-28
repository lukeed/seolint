---
title: title.content.null
summary: "The title does not include the word null. See what the title.content.null rule checks, why it matters, and how to configure it."
---

The title does not include the word `null`.

**Why:** `null` in a title is almost always a template bug, such as an empty value.

**When off:** titles with `null` pass.

```html
<!-- ✗ Fails -->
<title>null</title>

<!-- ✓ Passes -->
<title>About us</title>
```
