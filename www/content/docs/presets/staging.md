---
title: staging
summary: The staging seolint preset allows noindex and skips the checks against the production site, for staging and preview deploys.
---

For staging and preview deploys. These sites are not for search engines, so they usually have `noindex`, and they are not the production site. The preset turns off these rules:

| Rule                                                        | Why it is off                                          |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| [`robots.*`](/docs/rules/#robots)                           | A staging site should have `noindex` and `nofollow`.   |
| [`site.robots`](/docs/rules/site.robots/)                   | A staging site can block all crawlers in `robots.txt`. |
| [`site.sitemap`](/docs/rules/site.sitemap/)                 | The sitemap lists production URLs.                     |
| [`canonical.href.self`](/docs/rules/canonical.href.self/)   | Canonical links point to the production page.          |
| [`canonical.href.match`](/docs/rules/canonical.href.match/) | Canonical links point to the production host.          |
| [`og.url`](/docs/rules/og.url/)                             | `og:url` points to the production page.                |
| [`hreflang.self`](/docs/rules/hreflang.self/)               | `hreflang` links point to the production pages.        |

All other rules keep their defaults.
