---
title: description.content.length
summary: "The description length is within a range of characters. See what the description.content.length rule checks, why it matters, and how to configure it."
---

The description length is within a range of characters.

**Why:** Search results cut off descriptions at about 155 to 160 characters, and short descriptions say little about the page.

**When off:** descriptions of any length pass.

| Option | Type     | Default | Description                    |
| ------ | -------- | ------- | ------------------------------ |
| `min`  | `number` | `50`    | The fewest characters allowed. |
| `max`  | `number` | `160`   | The most characters allowed.   |

```html
<!-- ✗ Fails -->
<meta name="description" content="Our bakery." />

<!-- ✓ Passes -->
<meta
  name="description"
  content="Bongo Bakery bakes fresh bread, buns, and pastries every morning in the heart of town."
/>
```

```ts
rules: { "description.content.length": { min: 70, max: 155 } }
```
