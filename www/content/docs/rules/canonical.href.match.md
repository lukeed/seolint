---
title: canonical.href.match
summary: "The canonical href uses the site hostname. See what the canonical.href.match rule checks, why it matters, and how to configure it."
---

The canonical `href` uses the site hostname.

**Why:** A canonical link to another site hands your page's ranking to that site. This is often a copy-paste mistake.

Without a `hostname` option or a [`host`](/docs/config/#host), the rule is skipped.

**When off:** canonical links to any site pass.

| Option     | Type     | Default | Description                                                                     |
| ---------- | -------- | ------- | ------------------------------------------------------------------------------- |
| `hostname` | `string` | `""`    | The hostname to require. When empty, the rule uses the `host` from your config. |

```html
<!-- With host "https://example.com" -->

<!-- ✗ Fails -->
<link rel="canonical" href="https://other.com/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

```ts
rules: { "canonical.href.match": { hostname: "www.example.com" } }
```
