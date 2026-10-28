---
title: canonical.head
summary: "The canonical link is inside head. See what the canonical.head rule checks, why it matters, and how to configure it."
---

The canonical link is inside `<head>`.

**Why:** Search engines ignore a canonical link in `<body>`.

**When off:** canonical links anywhere pass.

```html
<!-- ✗ Fails -->
<body>
  <link rel="canonical" href="https://example.com/about/" />
</body>

<!-- ✓ Passes -->
<head>
  <link rel="canonical" href="https://example.com/about/" />
</head>
```
