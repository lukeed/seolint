---
title: jsonld.valid
summary: "Each JSON-LD script is valid JSON, with an @context and an @type. See what the jsonld.valid rule checks, why it matters, and how to configure it."
---

Each JSON-LD script is valid JSON, with an `@context` and an `@type`.

**Why:** Search engines read structured data from JSON-LD, the format that Google recommends, to show rich results. A JSON-LD script that does not parse, or that lacks an `@context` or an `@type`, is ignored, and nothing on the page shows it. The rule does not check the properties of each type; use Google's Rich Results Test for that.

An `@graph` of items also passes, when each item has an `@type`.

**When off:** any JSON-LD script passes.

```html
<!-- ✗ Fails -->
<script type="application/ld+json">
  { "@type": "Article", "headline": "Our sourdough" }
</script>

<!-- ✓ Passes -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Our sourdough"
  }
</script>
```
