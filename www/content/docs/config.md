---
title: Configuration
summary: Configure seolint in seolint.config.ts, with the site host, the inputs, pages to ignore, rule settings, presets, plugins, and workers.
---

# Configuration

seolint loads a config file from the working directory. It looks for these names, in this order:

1. `seolint.config.ts`
2. `seolint.config.mjs`
3. `seolint.config.cjs`
4. `seolint.config.js`

```ts
import * as config from "seolint/config";

export default config.define({
  host: "https://example.com",
  inputs: ["public"],
  ignore: ["404.html", "drafts/**"],
  rules: {
    "html.favicon": false,
    "title.content.length": { max: 70 },
    "link.external.limit": ["warn", { max: 10 }],
    "og.*": "error",
  },
});
```

`define()` returns the config as it is, but it type-checks it. An unknown rule name, or a wrong option type, is a type error. Command-line options, such as `--host`, override the same fields.

## Fields

| Field     | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `host`    | The site URL, such as `https://example.com`.                       |
| `inputs`  | Files, folders, or URLs to lint, when the command line gives none. |
| `ignore`  | Pages to skip, as glob patterns.                                   |
| `rules`   | Rule settings, by rule name or pattern.                            |
| `presets` | Other configs to merge in first.                                   |
| `plugins` | Your own plugins.                                                  |
| `workers` | How many threads lint pages.                                       |

## `host`

The URL of your site. seolint uses it to tell internal links from external ones, and to give each page its URL, such as `https://example.com/about/` for `public/about/index.html`.

Without a `host`, the `link.internal.*` rules do not run, and neither do the rules that compare against the page URL, such as [`canonical.href.self`](/docs/rules/canonical.href.self/).

## `inputs`

Files, folders, or URLs to lint, relative to the working directory. They must be all paths, or all URLs. See [Inputs](/docs/cli/#inputs).

## `ignore`

Pages to skip, as glob patterns. Ignored pages are also left out of the site checks, such as unique titles and the sitemap.

- A pattern matches the page's path inside the linted folder, such as `blog/draft/index.html`. For URLs, it matches the URL path, such as `blog/draft/`.
- `*` matches within one folder, `**` matches across folders, and `?` matches one character.
- A pattern without `/` matches at any depth, so `404.html` also matches `fr/404.html`.

```ts
ignore: ["404.html", "drafts/**", "tags/*/index.html"],
```

## `rules`

Each rule has a default severity, and some rules have options. A setting changes one rule, or every rule that a pattern matches:

| Setting               | Effect                                                    |
| --------------------- | --------------------------------------------------------- |
| `false`               | Turns the rule off.                                       |
| `true`                | Turns the rule on, with its default severity and options. |
| `"error"` or `"warn"` | Turns the rule on, with that severity.                    |
| `{ ... }`             | Turns the rule on, and overrides some of its options.     |
| `["warn", { ... }]`   | Sets the severity and some options.                       |

- **Severity:** an `error` makes the CLI exit with `1`. A `warn` is reported, but it does not change the exit code.
- **Patterns:** a name with `*`, such as `"og.*"`, sets every rule that matches. Patterns apply first, then exact names, so `{ "og.*": false, "og.title": true }` keeps only `og.title`.
- **Unknown names** are an error, so a typo does not go unnoticed.

See the [rules reference](/docs/rules/) for every rule, its default, and its options.

## `presets`

A preset is a config that your config merges in first. seolint has three: [`strict`](/docs/presets/strict/), [`essentials`](/docs/presets/essentials/), and [`staging`](/docs/presets/staging/).

```ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

export default config.define({
  presets: [presets.strict],
  rules: { "og.*": false },
});
```

Your config's own settings apply after its presets. See [Presets](/docs/presets/) for how presets merge, and how to write and share your own.

## `plugins`

Your own plugins, which run after the built-in ones. See [Plugins](/docs/plugins/).

## `workers`

seolint lints large sites in worker threads. By default, it uses one worker for about every 8 MB of HTML, up to half the CPU cores. Smaller sites, and URLs, stay on one thread, because a worker takes about 0.1 seconds to start.

```ts
workers: 4, // four threads
workers: 1, // one thread
```

The `--workers` option overrides it for one run, such as `seolint --workers 1`.

Each worker loads your plugins from the config file again. Plugins that you pass straight to the [API](/docs/api/) stay on one thread, and `workers` above 1 is then an error.
