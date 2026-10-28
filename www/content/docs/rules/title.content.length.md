---
title: title.content.length
summary: "The title length is within a range of characters. See what the title.content.length rule checks, why it matters, and how to configure it."
---

The title length is within a range of characters.

**Why:** Search results cut off titles at about 60 characters, and very short titles say little about the page.

**When off:** titles of any length pass.

| Option | Type     | Default | Description                    |
| ------ | -------- | ------- | ------------------------------ |
| `min`  | `number` | `10`    | The fewest characters allowed. |
| `max`  | `number` | `60`    | The most characters allowed.   |

```html
<!-- ✗ Fails -->
<title>Home</title>

<!-- ✓ Passes -->
<title>Fresh bread every morning</title>
```

```ts
rules: { "title.content.length": { max: 70 } }
```
