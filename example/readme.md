# Example

A small [Bongo](https://bongo.build) site with SEO problems on purpose, and a `seolint.config.ts` that sets rule options and adds custom plugins. A TypeScript config needs Node 22.18 or later, or Bun.

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

| Page                     | Problems on purpose                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/index.md`       | None. This page passes.                                                                                                                                         |
| `content/about.md`       | No `summary`, so no description. A short title. No `image`, so no `og:image`.                                                                                   |
| `content/blog/launch.md` | An image without `alt`. An external link with `target="_blank"` and no `rel`. An internal link with uppercase letters and a `.html` suffix. An `http://` image. |
| `content/contact.md`     | A `canonical` override with `http://` and uppercase letters. Two `<h1>` headings.                                                                               |

The layout, `layouts/html.hbs`, prints the description, the `og:image`, and a canonical override only when the page sets them in its front matter.

## Configuration

`seolint.config.ts` imports `seolint/config` and exports `config.define({...})`, which type-checks rule names and options against the built-in plugins and the plugins it lists. It shows the three ways to change what seolint checks:

- **`inputs` and `host`:** the folder to lint, and the site URL that tells internal links from external ones.
- **`rules`:** `false` turns a rule off, `true` turns it on with its default options, and an object overrides some options. `title.content.length` sets `min` and `max`, and `description.content.title` is off. A pattern such as `"link.*": false` sets every matching rule. An unknown rule name is an error.
- **`plugins`:** custom checks, made with `config.plugin()`. They run after the built-in plugins, and a plugin with the same name as a built-in one replaces it.
  - `lang`: the `<html>` element must have a `lang` attribute.
  - `heading`: a page needs exactly one `<h1>`.
  - `opengraph`: a page needs `og:title` and `og:image`. Its `og.image` rule has a `secure` option, off by default. This config turns it on, so the image must use `https://`.

A plugin has a `name`, its `rules`, and a `run(context, document)` function. `rules` maps each rule name to `true`, or to its default options; this types the `context`. `run` checks the document with `context.assert(rule, check, message, node)`, where `check` is a boolean or a function that receives the rule's options, or reports a failure with `context.report(rule, message, node)`. Pass the `node` to report its line and column. Neither reports a rule that the config turns off.

## Output

```txt
 FAIL  public/about/index.html
          ✘  A "meta[name=description]" must exist                      description.exists
          ✘  A "og:image" meta tag must exist                           og.image
     6:2  ✘  Must not have less than 10 characters                      title.content.length

 FAIL  public/blog/launch/index.html
    10:2  ✘  The "og:image" must be an https:// URL                     og.image
    20:1  ✘  Must have an `alt` attribute                               image.alt.exists
   21:23  ✘  Must include "rel=noopener" when "target=_blank" in use    link.blank.noopener
   21:23  ✘  Must include "rel=noreferrer" when "target=_blank" in use  link.blank.noreferrer
  21:107  ✘  Internal links should not include uppercase                link.internal.lowercase
  21:107  ✘  Internal links should not include ".html" suffix           link.internal.pretty

 FAIL  public/contact/index.html
     8:2  ✘  Must not include uppercase character(s)                    canonical.href.lowercase
     8:2  ✘  Must point to an "https://" address                        canonical.href.https
     8:2  ✘  Must include the provided `hostname` value                 canonical.href.match
    20:1  ✘  A page must have only one <h1>                             heading.single

 FAIL  Reported 13 errors!
```
