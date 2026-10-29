---
title: CI
summary: Run seolint in GitHub Actions, Gitea, Forgejo, or any CI, so each SEO problem shows on its file and line in the pull request.
---

# CI

seolint exits with `1` when it finds an error, so a CI step fails on errors, and passes with warnings. Run it after the step that builds your site.

## GitHub Actions

With `--format ci`, each problem shows as an annotation on its file and line, in the run summary and in the pull request. See an [example run](https://github.com/lukeed/seolint/actions/runs/40791628128) on the example site of the seolint repository, or the newer runs of its [Example workflow](https://github.com/lukeed/seolint/actions/workflows/example.yml).

A workflow that builds your site, then lints it:

```yaml
name: SEO

on:
  push:
  pull_request:

jobs:
  seolint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
      - run: npm ci
      - run: npm run build
      - run: npx seolint public --host https://example.com --format ci
```

With a [config file](/docs/config/) that sets `host` and `inputs`, the last step is only `npx seolint --format ci`.

### Annotations and the job summary

GitHub shows at most 10 errors and 10 warnings as annotations for each step. seolint prints every problem in the step's log, and it also writes them all as a table to the [job summary](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#adding-a-job-summary), on the page of the run. Each row links to the page of its rule.

## Gitea and Forgejo

Gitea Actions and Forgejo Actions read the same workflow commands, so the same workflow works there.

## Other CI services

Every CI service reads the exit code. Use the default `pretty` format for a readable log, or `--json` to save the report as a file:

```sh
npx seolint public --json > seolint.json
```

The JSON report maps each input to its messages. See [Output formats](/docs/cli/#output-formats).

## Staging and preview deploys

A staging site usually has `noindex`, and its canonical links point to production. The [`staging` preset](/docs/presets/staging/) turns off the rules that would fail there:

```ts
import * as config from "seolint/config";
import * as presets from "seolint/presets";

let staging = process.env.DEPLOY_ENV === "staging";

export default config.define({
  host: staging ? "https://staging.example.com" : "https://example.com",
  presets: staging ? [presets.staging] : [presets.strict],
});
```

## Adopt it on a large site

A site with many problems can start with the [`essentials` preset](/docs/presets/essentials/), which keeps only the rules that directly affect search results. Fix those first, then turn on more rules as you go.
