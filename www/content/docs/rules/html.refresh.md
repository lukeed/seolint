---
title: html.refresh
summary: "A page does not redirect with a meta refresh. See what the html.refresh rule checks, why it matters, and how to configure it."
---

A page does not redirect with a meta refresh.

**Why:** Google treats an instant meta refresh as a permanent redirect, and a delayed one as a temporary redirect, but recommends a server redirect, and uses a meta refresh only when a server redirect is not possible. A meta refresh also loads the old page first, and a delayed one can move the page while a visitor reads it.

**When off:** pages with a meta refresh pass. Turn the rule off when your host cannot redirect.

```html
<!-- ✗ Fails -->
<meta http-equiv="refresh" content="0; url=https://example.com/new/" />
```

## References

- [Google: Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects): Google recommends server redirects, and accepts a meta refresh only as a fallback, so the rule warns.
