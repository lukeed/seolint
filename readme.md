# seolint

> A robust and configurable SEO linter

seolint checks the HTML of a built site, or of live URLs, for SEO problems: titles, descriptions, canonical links, headings, links, images, social tags, and more. Some checks span the whole site, such as duplicate titles, broken links, and pages missing from the sitemap.

- **70 rules**, each documented in [`docs/rules`](www/content/docs/rules.md), with errors and warnings.
- **Configurable** in `seolint.config.ts`, with type-checked rule names and options.
- **Extensible** with your own plugins and/or presets, for one page or for the whole site.
- **CI-ready**, with exit codes, JSON output, and inline annotations for GitHub Actions.

## Install

```sh
$ npm install --save-dev seolint
```

seolint needs Node 22.8 or later, or Bun. A `seolint.config.ts` file needs Node 22.18 or later, or Bun.

## Usage

Lint the output folder of your site generator:

```sh
$ seolint public --host https://example.com
```

```txt
 FAIL  public/about/index.html
        ✘  A "meta[name=description]" must exist       description.exists
   5:2  ✘  Must not have less than 10 characters       title.content.length
  9:23  ⚠  Must describe the target, not "Click here"  link.text.vague

 FAIL  Reported 2 errors and 1 warning!
```

The `host` is the site URL. It tells internal links from external ones, and gives each page its URL, such as `https://example.com/about/`.

### Inputs

seolint takes files, folders, or URLs, but not both paths and URLs at once.

```sh
$ seolint public                       # every .html file in a folder
$ seolint public/index.html            # one file
$ seolint https://example.com/         # fetch and lint URLs
$ curl -s https://example.com | seolint -i   # HTML from stdin
```

A folder is treated as a site root, so it also gets the site checks for `robots.txt`, `sitemap.xml`, and broken links. Single files do not.

### Options

| Option            | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| `-H`, `--host`    | The site URL, such as `https://example.com`.                              |
| `-f`, `--format`  | The output format: `pretty` (default), `json`, or `ci`.                   |
| `-j`, `--json`    | The same as `--format json`.                                              |
| `-q`, `--quiet`   | Print nothing; only set the exit code.                                    |
| `-i`, `--input`   | Read HTML from stdin.                                                     |
| `--rules`         | List every rule, with its setting and description.                        |
| `--no-color`      | Print without colors. seolint also respects `NO_COLOR` and `FORCE_COLOR`. |
| `-v`, `--version` | Print the version.                                                        |
| `-h`, `--help`    | Print the help.                                                           |

seolint exits with `1` when there is at least one error, and with `0` when there are only warnings, or nothing.

### Formats

- **`pretty`** prints each file with its failures, sorted by position, to stderr.
- **`json`** prints the report as JSON: each input maps to a list of messages, with `rule`, `severity`, `message`, `line`, `col`, and a `docs` link.
- **`ci`** prints [GitHub Actions workflow commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions), which Gitea and Forgejo Actions also read. Each failure shows as an annotation on its file and line in pull requests.

```yaml
- run: npx seolint public --host https://example.com --format ci
```

## Configuration

seolint loads `seolint.config.ts`, `seolint.config.mjs`, `seolint.config.cjs`, or `seolint.config.js` from the working directory, in that order. Command-line options override it.

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

`define()` returns the config unchanged, but type-checks it: an unknown rule name, or a wrong option type, is a type error.

| Field     | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `host`    | The site URL, such as `https://example.com`.                        |
| `inputs`  | Files, folders, or URLs to lint, when the command line gives none.  |
| `ignore`  | Pages to skip, as glob patterns. See [Ignore pages](#ignore-pages). |
| `rules`   | Rule settings, by name or pattern. See [Rules](#rules).             |
| `plugins` | Your own plugins. See [Plugins](#plugins).                          |
| `presets` | Other configs to merge in first. See [Presets](#presets).           |
| `workers` | How many threads lint pages. See [Workers](#workers).               |

### Rules

Each rule has a default severity, and some have options. See [`docs/rules`](www/content/docs/rules.md) for every rule, or run `seolint --rules`.

| Setting               | Effect                                                    |
| --------------------- | --------------------------------------------------------- |
| `false`               | Turns the rule off.                                       |
| `true`                | Turns the rule on, with its default severity and options. |
| `"error"` or `"warn"` | Turns the rule on, with that severity.                    |
| `{ ... }`             | Turns the rule on, and overrides some of its options.     |
| `["warn", { ... }]`   | Sets the severity and some options.                       |

A name with `*`, such as `"og.*"`, sets every rule that matches. Patterns apply first, then exact names. An unknown rule name is an error.

### Ignore pages

`ignore` skips pages that match a glob pattern. Ignored pages are also left out of the site checks, such as unique titles and the sitemap.

- A pattern matches the page's path inside the linted folder, such as `blog/draft/index.html`. For URLs, it matches the URL path, such as `blog/draft/`.
- `*` matches within one folder, `**` matches across folders, and `?` matches one character.
- A pattern without `/` matches at any depth, so `404.html` also matches `fr/404.html`.

### Presets

A preset is a config to merge in first. `seolint/presets` has three:

| Preset       | Effect                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `strict`     | Every rule that defaults to a warning becomes an error.                                                               |
| `essentials` | Only the rules that directly affect search results. Useful to adopt seolint on a large site.                          |
| `staging`    | For staging and preview deploys. Allows `noindex`, and skips checks against the production site, such as the sitemap. |

```ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

let staging = process.env.DEPLOY_ENV === "staging";

export default config.define({
  host: "https://example.com",
  presets: staging ? [presets.staging] : [presets.strict],
  rules: { "og.*": false },
});
```

Presets merge in order, and the config's own fields win. A rule pattern, such as `"og.*"`, also replaces every earlier setting it matches, so one pattern can undo a preset. See [`docs/presets`](www/content/docs/presets.md) for what each preset sets, and how to write and share your own.

### Workers

seolint lints large sites in worker threads. By default, it uses one worker for about every 8 MB of HTML, up to half the CPU cores. Smaller sites, and URLs, stay on one thread, because a worker takes about 0.1 seconds to start. Set `workers` to choose the count, or set `workers: 1` to lint on one thread.

Each worker loads your plugins from the config file again. So plugins can run in workers only when they come from a config file. Plugins that you pass straight to the API stay on one thread, and `workers` above 1 is then an error.

## Plugins

A plugin checks each page with its own rules. Create one with `plugin()`. Its `rules` map each rule name to `true`, to `false` for a rule that is off by default, or to the rule's default options. They also type the `context`, so a misspelled rule name, or a wrong option, is a type error.

```ts
import * as config from "seolint/config";

const brand = config.plugin({
  name: "brand",
  rules: { "brand.title": { name: "" } },
  meta: {
    "brand.title": {
      description: "The title includes the brand name.",
      severity: "warn",
    },
  },
  run(context, document) {
    let title = document.find("title");
    context.assert(
      "brand.title",
      (options) => !options.name || (title?.text ?? "").includes(options.name),
      "The title must include the brand name",
      title,
    );
  },
});

export default config.define({
  plugins: [brand],
  rules: { "brand.title": { name: "Bongo Bakery" } },
});
```

- **`run(context, document)`** checks one page. `document` is a parsed [`@lukeed/html`](https://github.com/lukeed/html) document, with `find()`, `all()`, and `getAttr()`.
  - `context.assert(rule, check, message, node?)` reports a failure when `check` is `false`. The `check` can also be a function that receives the rule's options.
  - `context.report(rule, message, node?)` reports a failure.
  - `context.load(rule)` returns the rule's options, or `undefined` when it is off.
  - `context.url` is the page URL, and `context.options.host` is the site URL.
  - Pass the `node` that failed to report its line and column. Nothing is reported for a rule that the config turns off.
- **`finish(site, pages)`** is optional. It runs once after every page, with what `run` returned for each page, so it can compare pages. `site.report(rule, message, input, position?)` reports a failure on any page or file.
- **`meta`** is optional. It gives each rule a description, a default severity, and a `docs` link, for messages and `seolint --rules`.

A plugin with the same `name` as a built-in plugin replaces it. Two plugins cannot declare the same rule.

With [workers](#workers), each worker has its own copy of your plugins. Keep the data for `finish` in what `run` returns, not in variables that `run` changes, and return data that can be cloned, such as objects, arrays, and strings, but not functions.

See [`example/`](example) for a site with custom plugins.

## API

```ts
import * as seolint from "seolint";
import * as config from "seolint/config";
import * as presets from "seolint/presets";
```

### seolint

- **`lint(html, config?, url?)`** lints an HTML string. It resolves with a list of messages, or `undefined` when every rule passes. It does not run the site checks.
- **`fs(path, config?)`** lints a file, or every HTML file in a folder. It resolves with a report: each input maps to its messages.
- **`url(href, config?)`** fetches and lints a URL.
- **`run(config?, argv?)`** lints every `config.inputs`, relative to `argv.cwd`.

`lint()`, `fs()`, `url()`, and `run()` always run the built-in plugins, then `config.plugins`. They reject when a plugin throws, an input cannot be read, or the config names an unknown rule.

### seolint/config

- **`resolve(argv?)`** loads the nearest config file from `argv.cwd`, and applies `argv.host` and `argv.inputs` over it.
- **`define(config)`** types a config.
- **`plugin(definition)`** types a plugin.
- **`find(root, start)`** and **`load(root)`** find and load a config file.

### seolint/presets

- **`strict`**, **`essentials`**, and **`staging`**. See [`docs/presets`](www/content/docs/presets.md).

## Rules

See [`docs/rules`](www/content/docs/rules.md) for every built-in rule: what it checks, why it matters, its default, and how to configure it.

## Credits

Originally written by [@nickreese](https://github.com/nickreese) to audit [Elder Guide](https://elderguide.com/).

## License

MIT © [Nick Reese](https://nicholasreese.com) · [Luke Edwards](https://lukeed.com)
