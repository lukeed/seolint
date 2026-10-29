---
title: link.blank.noreferrer
summary: 'An external link with target="_blank" uses rel="noreferrer". See what the link.blank.noreferrer rule checks, why it matters, and how to configure it.'
---

An external link with `target="_blank"` uses `rel="noreferrer"`.

**Why:** Without `noreferrer`, the opened page learns which page sent the visitor. `noreferrer` also implies `noopener` in older browsers.

The rule is off by default. It is a privacy choice, not a search one, and it hides your referrals from the sites that you link to. Turn it on to keep the referrer private.

Internal links pass, because the page that opens is on your own site. Without a [`host`](/docs/config/#host), every absolute link counts as external.

**When off:** `target="_blank"` links without `noreferrer` pass.

```html
<!-- ✗ Fails -->
<a href="https://other.com/" target="_blank" rel="noopener">Recipe</a>

<!-- ✓ Passes -->
<a href="https://other.com/" target="_blank" rel="noopener noreferrer"
  >Recipe</a
>
<a href="/recipe/" target="_blank" rel="noopener">Recipe</a>
```

## References

- [MDN: rel=noreferrer](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noreferrer): What `noreferrer` does. It is a privacy choice, not a search one, so the rule is off by default.
