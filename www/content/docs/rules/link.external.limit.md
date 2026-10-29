---
title: link.external.limit
summary: "A page has at most a number of external links. See what the link.external.limit rule checks, why it matters, and how to configure it."
---

A page has at most a number of external links.

**Why:** A page with very many external links can look like a link farm, and passes little value to each link.

The rule is off by default. Google says there is no ideal number of links on a page. Turn it on to set a limit of your own.

**When off:** any number of external links passes.

| Option | Type     | Default | Description                                  |
| ------ | -------- | ------- | -------------------------------------------- |
| `max`  | `number` | `50`    | The most external links allowed on one page. |

```ts
rules: { "link.external.limit": { max: 20 } }
```
