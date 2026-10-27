# Presets

A preset is a config that your config merges in first. Use a preset to share one set of rules across sites, or to switch rules for one environment, such as a staging deploy.

## Contents

- [Use a preset](#use-a-preset)
- [How presets merge](#how-presets-merge)
- [Built-in presets](#built-in-presets)
  - [`strict`](#strict)
  - [`essentials`](#essentials)
  - [`staging`](#staging)
- [Write your own](#write-your-own)
  - [Share a preset](#share-a-preset)
  - [Add plugins](#add-plugins)

## Use a preset

Add presets to the `presets` field of `seolint.config.ts`:

```ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

export default config.define({
  host: "https://example.com",
  presets: [presets.strict],
  rules: { "og.*": false },
});
```

To use a different preset for each environment, choose it in the config:

```ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

let staging = process.env.DEPLOY_ENV === "staging";

export default config.define({
  host: staging ? "https://staging.example.com" : "https://example.com",
  presets: staging ? [presets.staging] : [presets.strict],
});
```

## How presets merge

seolint merges each preset in order, then your config. A preset can have its own `presets`, which merge in first.

| Field     | Merge                                                      |
| --------- | ---------------------------------------------------------- |
| `rules`   | A later setting replaces an earlier one for the same rule. |
| `plugins` | Plugins are added together, in order.                      |
| `ignore`  | Patterns are added together, in order.                     |
| `host`    | The last one that is set wins.                             |
| `inputs`  | The last one that is set wins.                             |

A rule pattern, such as `"og.*"`, also replaces every earlier setting that it matches. So one pattern in your config undoes a preset for a group of rules:

```ts
export default config.define({
  presets: [presets.strict], // sets "og.title": "error", "og.image": "error", ...
  rules: { "og.*": "warn" }, // every og rule is a warning again
});
```

Inside one `rules` object, patterns apply first, then exact names. So `{ "og.*": false, "og.title": true }` turns on only `og.title`.

## Built-in presets

Import the built-in presets from `seolint/presets`.

### `strict`

Every rule that defaults to `warn` becomes an error. Use it when the site must pass every check, such as in CI for a new site.

The preset sets these rules to `"error"`:

- [`html.favicon`](rules.md#htmlfavicon)
- [`description.content.title`](rules.md#descriptioncontenttitle)
- [`canonical.href.self`](rules.md#canonicalhrefself)
- [`heading.order`](rules.md#headingorder)
- [`link.external.limit`](rules.md#linkexternallimit)
- [`link.text.vague`](rules.md#linktextvague)
- [`hreflang.default`](rules.md#hreflangdefault)
- [`og.title`](rules.md#ogtitle)
- [`og.description`](rules.md#ogdescription)
- [`og.image`](rules.md#ogimage)
- [`og.image.secure`](rules.md#ogimagesecure)
- [`og.url`](rules.md#ogurl)
- [`twitter.card`](rules.md#twittercard)
- [`site.robots`](rules.md#siterobots)
- [`site.sitemap`](rules.md#sitesitemap)

Rules that are off by default, such as `canonical.href.match`, stay off.

### `essentials`

Only the rules that directly affect search results. All other rules are off. Use it to adopt seolint on a large site: fix these first, then turn on more rules.

| Setting                     | Checks                                      |
| --------------------------- | ------------------------------------------- |
| `"*": false`                | Turns off all rules, before the ones below. |
| `"title.*"`                 | The page title.                             |
| `"description.*"`           | The meta description.                       |
| `"canonical.*"`             | The canonical link.                         |
| `"robots.*"`                | The robots meta tag.                        |
| `"heading.exists"`          | The page has an `<h1>`.                     |
| `"heading.single"`          | The page has only one `<h1>`.               |
| `"html.lang"`               | The page language.                          |
| `"image.alt.exists"`        | Images have `alt` text.                     |
| `"viewport.exists"`         | The mobile viewport.                        |
| `"viewport.content.device"` | The viewport uses the device width.         |
| `"link.href.*"`             | Links have a valid `href`.                  |
| `"site.title.unique"`       | Titles are unique across the site.          |
| `"site.description.unique"` | Descriptions are unique across the site.    |
| `"site.link.exists"`        | Internal links point to pages that exist.   |

Rules from your own `plugins` are also off, because `"*"` matches them. Turn them on in your config.

### `staging`

For staging and preview deploys. These sites are not for search engines, so they usually have `noindex`, and they are not the production site. The preset turns off these rules:

| Rule                                                  | Why it is off                                          |
| ----------------------------------------------------- | ------------------------------------------------------ |
| [`robots.*`](rules.md#robots)                         | A staging site should have `noindex` and `nofollow`.   |
| [`site.robots`](rules.md#siterobots)                  | A staging site can block all crawlers in `robots.txt`. |
| [`site.sitemap`](rules.md#sitesitemap)                | The sitemap lists production URLs.                     |
| [`canonical.href.self`](rules.md#canonicalhrefself)   | Canonical links point to the production page.          |
| [`canonical.href.match`](rules.md#canonicalhrefmatch) | Canonical links point to the production host.          |
| [`og.url`](rules.md#ogurl)                            | `og:url` points to the production page.                |

All other rules keep their defaults.

## Write your own

A preset is a config. Make one with `define()`, the same as `seolint.config.ts`:

```ts
// seolint.base.ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

export default config.define({
  presets: [presets.strict],
  ignore: ["404.html", "drafts/**"],
  rules: {
    "title.content.length": { max: 70 },
    "twitter.*": false,
  },
});
```

```ts
// seolint.config.ts
import * as config from "seolint/config";
import base from "./seolint.base.ts";

export default config.define({
  host: "https://example.com",
  presets: [base],
});
```

A preset can set any config field. Leave `host` and `inputs` to each site, unless all sites share them.

### Share a preset

To use one preset across many sites, publish it as a package. Export the config, and add `seolint` as a peer dependency:

```ts
// @acme/seolint-preset
import * as config from "seolint/config";

export default config.define({
  rules: { "og.*": "error", "link.external.limit": { max: 5 } },
});
```

```json
{
  "name": "@acme/seolint-preset",
  "type": "module",
  "exports": "./index.js",
  "peerDependencies": {
    "seolint": "*"
  }
}
```

Publish JavaScript, or TypeScript types with it. Node does not strip types from files in `node_modules`.

### Add plugins

A preset can include plugins. Configs that use the preset run them, and can set their rules:

```ts
// @acme/seolint-preset
import * as config from "seolint/config";

const brand = config.plugin({
  name: "brand",
  rules: { "brand.title": { name: "" } },
  run(context, document) {
    // ...
  },
});

export default config.define({
  plugins: [brand],
  rules: { "brand.title": { name: "Acme" } },
});
```

```ts
// seolint.config.ts
import * as config from "seolint/config";
import acme from "@acme/seolint-preset";

export default config.define({
  presets: [acme],
  rules: { "brand.title": { name: "Acme Docs" } },
});
```

`define()` remembers the plugins of a config, so the config that uses it type-checks their rules too. Here, `"brand.title": { name: 1 }` is a type error.

A plugin replaces an earlier plugin with the same `name`, so two presets can include the same plugin. Two plugins with different names cannot declare the same rule.
