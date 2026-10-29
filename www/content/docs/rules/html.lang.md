---
title: html.lang
summary: "The html element has a valid lang attribute. See what the html.lang rule checks, why it matters, and how to configure it."
---

The `<html>` element has a valid `lang` attribute.

**Why:** Screen readers use `lang` to read the page aloud with the right voice, and browsers use it to translate and hyphenate. Google does not use it: it reads the language from the visible text. The value is a language tag, such as `en` or `pt-BR`, not a locale name, such as `en_US`.

**When off:** pages without a language, or with an invalid one, pass.

```html
<!-- ✗ Fails -->
<html></html>
<html lang="en_US"></html>

<!-- ✓ Passes -->
<html lang="en"></html>
<html lang="pt-BR"></html>
```

## References

- [WCAG 2.2: Understanding Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html): Pages must declare their language (Level A).
- [axe: html-has-lang](https://dequeuniversity.com/rules/axe/4.10/html-has-lang): The same check in axe-core.
- [axe: html-lang-valid](https://dequeuniversity.com/rules/axe/4.10/html-lang-valid): axe-core also checks that the value is valid.
- [RFC 5646: Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html): The format of a language tag.
- [Google: Multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites): Google reads the language from the visible text, not from `lang`.
