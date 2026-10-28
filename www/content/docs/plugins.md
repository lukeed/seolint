---
title: Plugins
summary: Write your own seolint rules as plugins, check each page with run(), compare pages with finish(), and share plugins with presets.
---

# Plugins

A plugin adds rules. The built-in rules are plugins too, so your rules work the same way: they report messages with positions, they take severities and options from the config, and they show in `seolint --rules`.

## Write a plugin

Create a plugin with `plugin()`, and add it to the `plugins` of your config:

```ts
import * as config from "seolint/config";

const MESSAGE = "The title must include the brand name";

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
    let options = context.load("brand.title");
    let title = document.find("title");
    if (options?.name && !title?.text.includes(options.name)) {
      context.report("brand.title", MESSAGE, title);
    }
  },
});

export default config.define({
  plugins: [brand],
  rules: { "brand.title": { name: "Bongo Bakery" } },
});
```

`define()` reads the rules of your plugins, so `"brand.title"` and its options are type-checked like the built-in rules.

## Fields

| Field    | Description                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `name`   | The plugin name. A plugin with the name of a built-in plugin, such as `"title"`, replaces it.           |
| `rules`  | Each rule name maps to `true`, to `false` for a rule that is off by default, or to its default options. |
| `meta`   | Optional. For each rule: a `description`, a default `severity`, and a `docs` link.                      |
| `run`    | Checks one page. What it returns goes to `finish`.                                                      |
| `finish` | Optional. Runs once after every page, to compare pages.                                                 |

A rule name must be unique: two plugins cannot declare the same rule. By convention, a rule name starts with its plugin name, such as `brand.title`.

## Check each page

`run(context, document)` runs once for each page.

`document` is the parsed page, from [`@lukeed/html`](https://github.com/lukeed/html). Use `find()` for the first element that matches a CSS selector, `all()` for every match, and `getAttr()` to read an attribute:

```ts
let canonical = document.find("link[rel=canonical]");
let href = canonical?.getAttr("href");
let images = document.all("img:not([alt])");
```

`context` reports problems, and reads the settings of your rules:

| Member                                        | Description                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `context.assert(rule, check, message, node?)` | Reports a problem when `check` is `false`. `check` can also be a function that gets the rule's options. |
| `context.report(rule, message, node?)`        | Reports a problem.                                                                                      |
| `context.load(rule)`                          | The rule's options, or `undefined` when the rule is off.                                                |
| `context.url`                                 | The URL of the page, when seolint knows it.                                                             |
| `context.options.host`                        | The site URL, from the config.                                                                          |

Pass the `node` that failed, so the message gets its line and column. seolint reports nothing for a rule that the config turns off, so `run` does not need to check that itself.

## Compare pages

Some problems only show across pages. `run` can return data for each page, and `finish(site, pages)` gets all of it once every page is done:

```ts
const unique = config.plugin({
  name: "unique",
  rules: { "unique.h1": true },
  run(context, document) {
    return { h1: document.find("h1")?.text.trim() };
  },
  finish(site, pages) {
    let seen = new Map<string, string>();
    for (let page of pages) {
      let h1 = page.data.h1;
      if (!h1) continue;

      let first = seen.get(h1);
      if (first) {
        let message = `Must be unique; ${first} has the same <h1>`;
        site.report("unique.h1", message, page.input);
      } else {
        seen.set(h1, page.input);
      }
    }
  },
});
```

Each item of `pages` has the `input` path or URL, its `url`, and the `data` that `run` returned. `site.report(rule, message, input, position?)` reports a problem on any page or file. `site.roots` lists the linted folders, for checks that read other files, such as `robots.txt`.

## Plugins in workers

On a large site, seolint runs `run` in [worker threads](/docs/config/#workers). Each worker loads your plugins from the config file again, so:

- Keep the data for `finish` in what `run` returns, not in variables that `run` changes.
- Return data that can be cloned, such as objects, arrays, strings, and numbers, but not functions.

## Share a plugin

To use a plugin across sites, put it in a [preset](/docs/presets/#write-your-own), and publish the preset as a package. Configs that use the preset get its plugins, with type-checked rules.

See the [example site](https://github.com/lukeed/seolint/tree/main/example) for a project with two custom plugins.
