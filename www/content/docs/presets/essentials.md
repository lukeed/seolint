---
title: essentials
summary: The essentials seolint preset keeps only the rules that directly affect search results, to adopt seolint on a large site.
---

Only the rules that directly affect search results. All other rules are off. Use it to adopt seolint on a large site: fix these first, then turn on more rules.

| Setting                     | Checks                                                     |
| --------------------------- | ---------------------------------------------------------- |
| `"*": false`                | Turns off all rules, before the ones below.                |
| `"title.*"`                 | The page title.                                            |
| `"description.*"`           | The meta description.                                      |
| `"canonical.*"`             | The canonical link.                                        |
| `"robots.*"`                | The robots meta tag.                                       |
| `"hreflang.*"`              | The links to translated pages.                             |
| `"heading.exists"`          | The page has an `<h1>`.                                    |
| `"image.alt.exists"`        | Images have `alt` text.                                    |
| `"viewport.exists"`         | The mobile viewport.                                       |
| `"viewport.content.device"` | The viewport uses the device width.                        |
| `"link.href.*"`             | Links have a valid `href`.                                 |
| `"site.title.unique"`       | Titles are unique across the site.                         |
| `"site.description.unique"` | Descriptions are unique across the site.                   |
| `"site.link.exists"`        | Internal links point to pages that exist.                  |
| `"site.canonical.exists"`   | Canonical links point to pages that exist.                 |
| `"site.robots.noindex"`     | robots.txt does not hide a `noindex`.                      |
| `"#style": false`           | Turns off style rules, such as `canonical.href.lowercase`. |

Rules from your own `plugins` are also off, because `"*"` matches them. Turn them on in your config.
