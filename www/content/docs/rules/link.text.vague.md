---
title: link.text.vague
summary: 'A link text describes its target, unlike "click here". See what the link.text.vague rule checks, why it matters, and how to configure it.'
---

A link text describes its target, unlike "click here".

**Why:** Search engines use link text to learn what the target page is about. "Click here" tells them nothing. The check ignores case and punctuation.

**When off:** vague link text passes.

| Option  | Type       | Default   | Description                                                           |
| ------- | ---------- | --------- | --------------------------------------------------------------------- |
| `words` | `string[]` | see above | The link texts to report, in lowercase. Setting it replaces the list. |

```html
<!-- ✗ Fails -->
<a href="/menu/">Click here</a>

<!-- ✓ Passes -->
<a href="/menu/">See our full menu</a>
```

```ts
rules: { "link.text.vague": { words: ["click here", "here", "go"] } }
```
