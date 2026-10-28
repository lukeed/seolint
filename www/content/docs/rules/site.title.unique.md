---
title: site.title.unique
summary: "Every page has a different title. See what the site.title.unique rule checks, why it matters, and how to configure it."
---

Every page has a different title.

**Why:** Search engines use titles to tell pages apart. When two pages share a title, they compete for the same searches, and one may be left out of results. Case is ignored.

**When off:** duplicate titles pass.

```html
<!-- ✗ Fails -->
<!-- index.html -->
<title>Bongo Bakery</title>
<!-- about/index.html -->
<title>Bongo Bakery</title>

<!-- ✓ Passes -->
<!-- index.html -->
<title>Bongo Bakery, fresh bread every morning</title>
<!-- about/index.html -->
<title>About Bongo Bakery</title>
```
