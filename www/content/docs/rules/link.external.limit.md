---
title: link.external.limit
summary: "A page has at most a number of external links. See what the link.external.limit rule checks, why it matters, and how to configure it."
---

A page has at most a number of external links.

**Why:** A page with very many external links looks like a link farm to search engines, and passes little value to each link.

**When off:** any number of external links passes.

| Option | Type     | Default | Description                                  |
| ------ | -------- | ------- | -------------------------------------------- |
| `max`  | `number` | `50`    | The most external links allowed on one page. |

```ts
rules: { "link.external.limit": { max: 20 } }
```
