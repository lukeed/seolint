---
title: mixed.content
summary: "An https:// page loads no resources over http://. See what the mixed.content rule checks, why it matters, and how to configure it."
---

An `https://` page loads no resources over `http://`.

**Why:** Browsers block, or warn about, insecure images, scripts, and styles on secure pages, so the page breaks or shows a "not secure" warning. The rule checks `src`, `srcset`, `href`, `poster`, and `data` on images, sources, scripts, stylesheets and other links, frames, media, embeds, and objects. Canonical and alternate links are left to their own rules. It runs when the page URL, or else the `host`, uses `https://`.

**When off:** insecure resources pass.

```html
<!-- On https://example.com/ -->

<!-- ✗ Fails -->
<img src="http://example.com/oven.jpg" alt="Our oven" />

<!-- ✓ Passes -->
<img src="https://example.com/oven.jpg" alt="Our oven" />
<img src="/oven.jpg" alt="Our oven" />
```
