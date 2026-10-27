# Example

A small [Bongo](https://bongo.build) site with SEO problems on purpose, and a `seolint.config.ts` that sets rules and adds custom plugins. A TypeScript config needs Node 22.18 or later, or Bun.

## Run it

From the repository root:

```sh
$ bun install
$ bun run build          # build seolint
$ bun run example build  # build the site into example/public
$ bun run example lint   # lint example/public
```

`lint` runs the CLI that `bun run build` writes, through the `seolint` workspace dependency. It exits with `1`, because the site has errors.

## Pages

| Page                     | Problems on purpose                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `content/index.md`       | None. It only fails `site.description.unique`, because the contact page copies its description.                                                                                            |
| `content/about.md`       | No `summary`, so no description. No `image`. A short title without the brand name. Too few words. A "click here" link.                                                                     |
| `content/blog/launch.md` | An image without `alt`. An external link with `target="_blank"` and no `rel`. A link to `/Menu.html`, which does not exist. An `<h3>` after the `<h1>`. An `http://` image and `og:image`. |
| `content/contact.md`     | A `canonical` override with `http://` and uppercase letters. Two `<h1>` headings. `noindex`. The home page's description. It is left out of the sitemap.                                   |

The layout, `layouts/html.hbs`, prints the description, `og:image`, `noindex`, and a canonical override only when a page sets them in its front matter. `content/robots.txt` and `content/favicon.svg` are copied as they are, and `content/sitemap.xml.hbs` lists every page without `noindex`.

## Configuration

`seolint.config.ts` imports `seolint/config` and exports `config.define({...})`, which type-checks rule names and options against the built-in plugins and the plugins it lists.

- **`host` and `inputs`:** the site URL, and the folder to lint. The `host` tells internal links from external ones, and gives each page its URL, such as `https://example.com/about/`.
- **`rules`:** `description.content.title` is off, `link.external.limit` is a warning with its own `max`, and `"og.*": "error"` turns every Open Graph warning into an error. See [`docs/rules.md`](../docs/rules.md) for every rule and setting.
- **`plugins`:** custom checks, made with `config.plugin()`.
  - `brand`: the title must include the brand name. The config sets the name as the `brand.title` option.
  - `words`: `<main>` needs at least 20 words. Its `meta` makes it a warning by default.

A plugin has a `name`, its `rules`, optional `meta`, and a `run(context, document)` function:

- `rules` maps each rule name to `true`, `false` for a rule that is off by default, or its default options. This types the `context`.
- `meta` gives each rule a description, a default severity, and a docs link.
- `run` checks the document with `context.assert(rule, check, message, node)`, where `check` is a boolean or a function that receives the rule's options, or reports a failure with `context.report(rule, message, node)`. Pass the `node` to report its line and column. Neither reports a rule that the config turns off. `context.url` is the page URL.
- An optional `finish(site, pages)` step checks the whole site, with what `run` returned for each page.

## Output

```txt
 FAIL  public/about/index.html
          ✘  A "meta[name=description]" must exist                                   description.exists
          ✘  A "og:description" meta tag must exist                                  og.description
          ✘  A "og:image" meta tag must exist                                        og.image
     6:2  ✘  Must not have less than 10 characters                                   title.content.length
     6:2  ✘  The title must include the brand name                                   brand.title
    19:8  ⚠  Must have more words; found 14                                          words.min
   21:52  ⚠  Must describe the target, not "click here"                              link.text.vague

 FAIL  public/blog/launch/index.html
     6:2  ✘  The title must include the brand name                                   brand.title
    13:2  ✘  The "og:image" must be an absolute https:// URL                         og.image.secure
    24:1  ✘  Must have an `alt` attribute; use alt="" for decorative images          image.alt.exists
   25:23  ✘  Must include "rel=noopener" when "target=_blank" in use                 link.blank.noopener
   25:23  ✘  Must include "rel=noreferrer" when "target=_blank" in use               link.blank.noreferrer
  25:107  ✘  Internal links should not include uppercase                             link.internal.lowercase
  25:107  ✘  Internal links should not include ".html" suffix                        link.internal.pretty
  25:107  ✘  Must point to a file that exists, not /Menu.html                        site.link.exists
    26:1  ⚠  Must not skip from <h1> to <h3>                                         heading.order
    28:1  ✘  Must load "src" over https://, not http://                              mixed.content

 FAIL  public/contact/index.html
          ⚠  Must be listed in sitemap.xml, as https://example.com/contact/          site.sitemap
     7:2  ✘  Must be unique; 1 other page uses the same description                  site.description.unique
     9:2  ✘  Must not use "noindex", which removes the page from search results      robots.noindex
    11:2  ✘  Must not include uppercase character(s)                                 canonical.href.lowercase
    11:2  ✘  Must point to an "https://" address                                     canonical.href.https
    11:2  ✘  Must include the provided `hostname` value                              canonical.href.match
    11:2  ⚠  Must point to this page, https://example.com/contact/                   canonical.href.self
    13:2  ✘  The "og:url" must match the canonical URL, http://Example.com/Contact/  og.url
    25:1  ✘  A page must have only one <h1>                                          heading.single

 FAIL  public/index.html
     7:2  ✘  Must be unique; 1 other page uses the same description                  site.description.unique

 FAIL  Reported 22 errors and 5 warnings!
```
