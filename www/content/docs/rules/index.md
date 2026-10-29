---
title: Rules
summary: Every built-in seolint rule, grouped by plugin, with what it checks and its default severity, and how to configure each one.
---

# Rules

seolint checks every page with the rules below. Each rule belongs to a built-in plugin, and runs unless your config turns it off.

## Configure a rule

Set rules in the `rules` field of `seolint.config.ts`:

```ts
import * as config from "seolint/config";

export default config.define({
  rules: {
    "html.favicon": false, // turn a rule off
    "heading.order": "error", // change its severity
    "title.content.length": { max: 70 }, // change some options
    "link.external.limit": ["warn", { max: 10 }], // both
    "og.*": "error", // every rule that matches a pattern
    "#style": false, // every rule of a category
  },
});
```

| Setting               | Effect                                                    |
| --------------------- | --------------------------------------------------------- |
| `false`               | Turns the rule off.                                       |
| `true`                | Turns the rule on, with its default severity and options. |
| `"error"` or `"warn"` | Turns the rule on, with that severity.                    |
| `{ ... }`             | Turns the rule on, and overrides some of its options.     |
| `["warn", { ... }]`   | Sets the severity and some options.                       |

- **Severity:** an `error` makes the CLI exit with `1`. A `warn` is reported, but does not change the exit code.
- **Patterns:** a name with `*` sets every rule that matches.
- **Categories:** a `#` key, such as `"#style"`, sets every rule of that [category](#categories). It takes `true`, `false`, or a severity.
- **Order:** patterns apply first, then categories, then exact names. So `{ "og.*": false, "og.title": true }` keeps only `og.title`, and `{ "*": false, "#search": true }` keeps only the search rules.
- **Unknown names** are an error, so a typo does not go unnoticed. `define()` also checks rule names and options as you type.
- **The page URL:** some rules compare against the page's own URL. For a file, it is the `host` plus the file's path, without `index.html`. Without a `host`, these rules are skipped.

Run `seolint --rules` to list every rule with its current setting.

## Categories

Each rule has one category, for what it is for, which the page of the rule shows.

| Category         | Rules about                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| `#search`        | How search engines crawl, index, and show your pages.                          |
| `#accessibility` | Screen readers, zoom, and the keyboard, when search is not affected.           |
| `#social`        | Link previews in social networks and chat apps.                                |
| `#style`         | One house style, such as one form for URLs. They do not change search results. |
| `#security`      | The safety of your pages and visitors, such as mixed content.                  |

A rule that matters to search and to accessibility, such as [`image.alt.exists`](/docs/rules/image.alt.exists/), is a search rule.

## html

Rules about the document as a whole.

<bongo:ruletable plugin="html" />

## title

Rules about the `<title>` element, which search results show as the link text.

<bongo:ruletable plugin="title" />

## description

Rules about `<meta name="description">`, which search results often show below the title.

<bongo:ruletable plugin="description" />

## canonical

Rules about `<link rel="canonical">`, which tells search engines the main URL of a page.

<bongo:ruletable plugin="canonical" />

## viewport

Rules about `<meta name="viewport">`, which controls how a page fits on phones.

<bongo:ruletable plugin="viewport" />

## heading

Rules about headings, which show search engines how a page is organized.

<bongo:ruletable plugin="heading" />

## robots

Rules about `<meta name="robots">` and `<meta name="googlebot">`.

<bongo:ruletable plugin="robots" />

## image

Rules about `<img>` elements.

<bongo:ruletable plugin="image" />

## link

Rules about `<a>` elements. A link is internal when it is relative, or when its hostname matches the `host`. Without a `host`, every absolute link counts as external. Except for `link.href.exists` and `link.text.exists`, links to a section of the same page, such as `#install`, and links to `mailto:` and `javascript:` are skipped, and each `href` is checked once per page. Links to a section of the same page also skip `link.text.vague`.

<bongo:ruletable plugin="link" />

## mixed

<bongo:ruletable plugin="mixed" />

## hreflang

Rules about `<link rel="alternate" hreflang>`, which point search engines to translated versions of a page. They only run on pages with such links.

<bongo:ruletable plugin="hreflang" />

## og

Rules about Open Graph tags, which social networks and chat apps use for link previews. They do not change search ranking, so they default to `warn`. Set `"og.*": "error"` to require them.

<bongo:ruletable plugin="og" />

## twitter

<bongo:ruletable plugin="twitter" />

## jsonld

Rules about JSON-LD, the structured data in `<script type="application/ld+json">` that Google reads for rich results.

<bongo:ruletable plugin="jsonld" />

## site

Rules that compare pages across the whole site. They run when you lint a folder, or URLs, with `seolint public` or `run()`. They do not run for `lint()`, which checks one page.

- `site.title.unique` and `site.description.unique` run for files and URLs. They skip pages with `noindex`, or with a canonical link to another URL.
- The other `site.*` rules read the built files, so they only run for folders, which they treat as site roots. Most of them also need a `host`, to match pages to their URLs.

Two rules of other plugins also compare pages: [`link.internal.trailing`](/docs/rules/link.internal.trailing/) reads the built files, and [`hreflang.return`](/docs/rules/hreflang.return/) compares the linted pages.

<bongo:ruletable plugin="site" />
