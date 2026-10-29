---
title: CLI
summary: The seolint command line, with its inputs, every option, the pretty, JSON, and CI output formats, and the exit codes that it sets.
---

# CLI

```sh
seolint [inputs] [options]
```

## Inputs

seolint takes files, folders, or URLs. One run takes paths or URLs, but not both.

```sh
seolint public                    # every .html file in a folder
seolint public/index.html         # one file
seolint public docs/index.html    # many inputs
seolint https://example.com/      # fetch and lint a URL
curl -s https://example.com | seolint -i   # HTML from stdin
```

- **A folder** is a site root. seolint lints every `.html` file inside it, and also runs the site checks, for `robots.txt`, `sitemap.xml`, and broken links.
- **A file** gets the checks for one page, but not the site checks.
- **A URL** is fetched and linted. Its origin is the `host`, unless you set one.

Without inputs, seolint uses the `inputs` of your [config file](/docs/config/).

## Options

| Option            | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| `-H`, `--host`    | The site URL, such as `https://example.com`.                              |
| `-f`, `--format`  | The output format: `pretty` (default), `json`, or `ci`.                   |
| `-j`, `--json`    | The same as `--format json`.                                              |
| `-q`, `--quiet`   | Print nothing. Only set the exit code.                                    |
| `-i`, `--input`   | Read HTML from stdin.                                                     |
| `--workers`       | How many threads lint pages. See [Workers](/docs/config/#workers).        |
| `--rules`         | List every rule, with its setting and description.                        |
| `--no-color`      | Print without colors. seolint also respects `NO_COLOR` and `FORCE_COLOR`. |
| `-v`, `--version` | Print the version.                                                        |
| `-h`, `--help`    | Print the help.                                                           |

Options override the same fields of your config file.

## Output formats

### `pretty`

The default. It prints each page with its problems, sorted by position, to stderr:

```txt
 FAIL  public/about/index.html
         ✘  A "meta[name=description]" must exist       description.exists
    6:2  ✘  Must not have less than 10 characters       title.content.length
  21:52  ⚠  Must describe the target, not "click here"  link.text.vague

 FAIL  Reported 2 errors and 1 warning!
```

### `json`

It prints the report as JSON to stdout. Each input maps to a list of messages:

```json
{
  "public/about/index.html": [
    {
      "rule": "title.content.length",
      "severity": "error",
      "message": "Must not have less than 10 characters",
      "line": 6,
      "col": 2,
      "docs": "https://seolint.io/docs/rules/title.content.length/"
    }
  ]
}
```

A message has no `line` and `col` when the problem has no element, such as a missing tag.

### `ci`

It prints [GitHub Actions workflow commands](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions) to stdout. GitHub, Gitea, and Forgejo Actions show each one as an annotation on its file and line:

```txt
::error file=public/about/index.html,line=6,col=2,title=title.content.length::Must not have less than 10 characters
::warning file=public/about/index.html,line=21,col=52,title=link.text.vague::Must describe the target, not "click here"
seolint: 2 errors and 1 warning
```

In GitHub Actions, the `ci` format also writes every problem as a table to the job summary, because GitHub shows only the first 10 errors and 10 warnings of a step as annotations. See an [example run](https://github.com/lukeed/seolint/actions/runs/40791628128), and [CI](/docs/ci/) for a complete workflow.

## Exit codes

| Code | When                                                                       |
| ---- | -------------------------------------------------------------------------- |
| `0`  | No errors. There can be warnings.                                          |
| `1`  | At least one error, or seolint could not run, such as for a missing input. |

The exit code is the same in every format.

## List the rules

`--rules` prints every rule with its setting from your config, its default options, and its description. Add `--json` for a JSON list:

```sh
seolint --rules
seolint --rules --json
```
