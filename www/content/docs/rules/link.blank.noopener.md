---
title: link.blank.noopener
summary: 'A link with target="_blank" uses rel="noopener". See what the link.blank.noopener rule checks, why it matters, and how to configure it.'
---

A link with `target="_blank"` uses `rel="noopener"`.

**Why:** Without `noopener`, the opened page can control yours through `window.opener`, such as to redirect it to a phishing page.

The rule is off by default. Every current browser treats `target="_blank"` as `noopener`, as the HTML spec says, and the rule does not affect search results. Turn it on to support older browsers.

**When off:** `target="_blank"` links without `noopener` pass.

```html
<!-- ✗ Fails -->
<a href="https://other.com/" target="_blank">Recipe</a>

<!-- ✓ Passes -->
<a href="https://other.com/" target="_blank" rel="noopener noreferrer"
  >Recipe</a
>
```

## References

- [HTML spec: Link type "noopener"](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener): `target="_blank"` implies `noopener` in the HTML spec.
- [caniuse: target="_blank" implies rel="noopener"](https://caniuse.com/mdn-html_elements_a_implicit_noopener): Every current browser applies it, so the rule is off by default.
- [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener): What `noopener` does.
