---
title: API
summary: Use seolint from JavaScript or TypeScript, with lint(), fs(), url(), and run(), and load configs with the seolint/config module.
---

# API

seolint has three modules:

```ts
import * as seolint from "seolint";
import * as config from "seolint/config";
import * as presets from "seolint/presets";
```

## `seolint`

### `lint(html, config?, url?)`

Lints an HTML string. It resolves with a list of [messages](#messages), or `undefined` when every rule passes. It does not run the site checks, because it sees one page.

```ts
let messages = await seolint.lint("<html>...</html>", {
  host: "https://example.com",
});
```

Give the page's `url` for the rules that compare against it, such as [`canonical.href.self`](/docs/rules/canonical.href.self/).

### `fs(path, config?)`

Lints a file, or every HTML file in a folder. A folder is a site root, so it also gets the site checks. It resolves with a [report](#reports).

```ts
let report = await seolint.fs("public", await config.resolve());
```

### `url(href, config?)`

Fetches and lints a URL. It resolves with a [report](#reports). Its origin is the `host`, unless the config sets one.

### `run(config?, argv?)`

Lints every `config.inputs`, relative to `argv.cwd`. This is what the CLI does.

```ts
let options = { cwd: process.cwd() };
let report = await seolint.run(await config.resolve(options), options);
```

`lint()`, `fs()`, `url()`, and `run()` run the built-in plugins, then `config.plugins`. They reject when a plugin throws, when an input cannot be read, or when the config names an unknown rule.

## `seolint/config`

- **`resolve(argv?)`** loads the config file from `argv.cwd`, and applies `argv.host` and `argv.inputs` over it. It rejects for an invalid config.
- **`define(config)`** types a config. See [Configuration](/docs/config/).
- **`plugin(definition)`** types a plugin. See [Plugins](/docs/plugins/).
- **`find(root, start)`** and **`load(root)`** find and load a config file.

## `seolint/presets`

The built-in presets: [`strict`](/docs/presets/strict/), [`essentials`](/docs/presets/essentials/), and [`staging`](/docs/presets/staging/).

## Messages

Each problem is a message:

| Field      | Type                  | Description                                           |
| ---------- | --------------------- | ----------------------------------------------------- |
| `rule`     | `string`              | The rule name, such as `title.content.length`.        |
| `severity` | `"error"` or `"warn"` | The severity from the config.                         |
| `message`  | `string`              | What is wrong.                                        |
| `line`     | `number`              | The line of the element. Absent without an element.   |
| `col`      | `number`              | The column of the element. Absent without an element. |
| `docs`     | `string`              | A link to the rule's page, when the rule has one.     |

## Reports

`fs()`, `url()`, and `run()` resolve with a report. Each input with problems maps to its messages. Inputs with no problems are left out:

```ts
let report = await seolint.fs("public");
for (let [input, messages] of Object.entries(report)) {
  console.log(input, messages.length);
}
```

## Types

`seolint` exports the types of the API, such as `Config`, `Plugin`, `Message`, `Report`, `Severity`, and `Setting`. `seolint/config` exports the types for configs and plugins, such as `Config`, `Plugin`, and `Setting`.
