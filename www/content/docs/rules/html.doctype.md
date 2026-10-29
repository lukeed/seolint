---
title: html.doctype
summary: "A page starts with the HTML doctype. See what the html.doctype rule checks, why it matters, and how to configure it."
---

A page starts with `<!doctype html>`.

**Why:** Without the doctype, browsers render the page in quirks mode, which changes the layout and can hide content.

**When off:** pages without a doctype pass.

```html
<!-- ✗ Fails -->
<html lang="en">
  ...
</html>

<!-- ✓ Passes -->
<!doctype html>
<html lang="en">
  ...
</html>
```

## References

- [HTML spec: The DOCTYPE](https://html.spec.whatwg.org/multipage/syntax.html#the-doctype): A document must start with a DOCTYPE.
- [MDN: Quirks mode and standards mode](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Quirks_mode_and_standards_mode): Without `<!doctype html>`, browsers render the page in quirks mode.
