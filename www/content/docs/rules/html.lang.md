---
title: html.lang
summary: "The html element has a valid lang attribute. See what the html.lang rule checks, why it matters, and how to configure it."
---

The `<html>` element has a valid `lang` attribute.

**Why:** Screen readers use `lang` to read the page aloud with the right voice, and browsers use it to translate and hyphenate. Bing uses it to know the page language. Google uses the visible text instead. The value is a language tag, such as `en` or `pt-BR`, not a locale name, such as `en_US`.

**When off:** pages without a language, or with an invalid one, pass.

```html
<!-- ✗ Fails -->
<html></html>
<html lang="en_US"></html>

<!-- ✓ Passes -->
<html lang="en"></html>
<html lang="pt-BR"></html>
```
