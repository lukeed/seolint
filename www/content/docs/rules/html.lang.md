---
title: html.lang
summary: "The html element has a lang attribute. See what the html.lang rule checks, why it matters, and how to configure it."
---

The `<html>` element has a `lang` attribute.

**Why:** Search engines and screen readers use `lang` to know the page language, which helps them serve the page to the right people and read it aloud correctly.

**When off:** pages without a language pass.

```html
<!-- ✗ Fails -->
<html>
  <!-- ✓ Passes -->
  <html lang="en"></html>
</html>
```
