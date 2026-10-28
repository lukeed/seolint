---
title: Presets
summary: How seolint presets work, how they merge with your config, the built-in presets, and how to write and share your own.
---

# Presets

A preset is a config that your config merges in first. Use a preset to share one set of rules across sites, or to switch rules for one environment, such as a staging deploy.

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

Import the built-in presets from `seolint/presets`:

- [`strict`](/docs/presets/strict/) turns every rule that defaults to a warning into an error.
- [`essentials`](/docs/presets/essentials/) keeps only the rules that directly affect search results.
- [`staging`](/docs/presets/staging/) allows `noindex` on staging and preview deploys.

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
