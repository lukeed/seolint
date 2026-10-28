---
title: Quickstart
summary: Lint the output folder of your site generator with seolint, read the report, add a config file, and run seolint in CI on every push.
---

# Quickstart

This guide lints a built site, reads the report, and adds a config file. It takes a few minutes.

## 1. Build your site

seolint reads the HTML that your site generator writes. Build your site first, so the output folder exists:

```sh
npm run build
```

## 2. Lint the output folder

Run seolint on the output folder, such as `public` or `dist`, and give it the URL of your site:

```sh
npx seolint public --host https://example.com
```

The `--host` tells internal links from external ones, and gives each page its URL, such as `https://example.com/about/`. Without it, the checks for internal links do not run.

## 3. Read the report

seolint prints each page that has problems, with one line for each problem:

```txt
 FAIL  public/about/index.html
         ✘  A "meta[name=description]" must exist       description.exists
    6:2  ✘  Must not have less than 10 characters       title.content.length
  21:52  ⚠  Must describe the target, not "click here"  link.text.vague

 FAIL  Reported 2 errors and 1 warning!
```

Each line has four columns:

1. The line and column of the element. A problem with no element, such as a missing tag, has no position.
2. `✘` for an error, or `⚠` for a warning.
3. The message.
4. The rule name. Each rule has a page in the [rules reference](/docs/rules/), such as [`title.content.length`](/docs/rules/title.content.length/).

seolint exits with `1` when there is at least one error. Warnings do not fail the run.

## 4. Add a config file

Create `seolint.config.ts` in your project folder, so you do not need the options each time:

```ts
import * as config from "seolint/config";

export default config.define({
  host: "https://example.com",
  inputs: ["public"],
  rules: {
    "title.content.length": { max: 70 },
    "link.text.vague": false,
  },
});
```

Now run seolint with no options:

```sh
npx seolint
```

`define()` checks the rule names and options as you type. See [Configuration](/docs/config/) for every field.

## 5. Run it in CI

Add seolint after the build step of your CI. With `--format ci`, each problem shows on its file and line in the pull request:

```yaml
- run: npm run build
- run: npx seolint --format ci
```

See [CI](/docs/ci/) for a complete workflow.

## Next steps

- Adopt seolint on a large site with the [`essentials` preset](/docs/presets/essentials/), then turn on more rules.
- Write your own rules with [plugins](/docs/plugins/).
- Lint from your own scripts with the [API](/docs/api/).
