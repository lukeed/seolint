---
title: Introduction
summary: seolint checks the HTML of a built site, or of live URLs, for SEO problems, and points to the exact line of each one. Start here.
---

# Introduction

seolint is a linter for SEO. It reads the HTML that your site generator builds, and reports each problem that search engines and social apps will see.

## What it checks

On every page, seolint checks the title, the meta description, the canonical link, the viewport, headings, robots tags, images, links, mixed content, `hreflang`, Open Graph tags, and Twitter cards.

Across the whole site, it finds titles and descriptions that two pages share, links to files that do not exist, a `robots.txt` that blocks every crawler, and pages that are missing from `sitemap.xml`.

Each check is a rule. Each rule has its own page in the [rules reference](/docs/rules/), with what it checks, why it matters, and how to change it.

## How it works

1. You build your site, as usual.
2. You run `seolint` on the output folder, such as `public` or `dist`. It can also fetch live URLs.
3. seolint parses each page and runs every rule on it. Then it runs the site checks on all pages together.
4. It prints each problem with its file, line, and column. An error makes the run fail, and a warning does not.

seolint does not read your templates or your framework. It reads the HTML that you ship, so it works with every site generator.

## What makes it different

- **Exact positions.** Each message has the line and column of the element, so you go straight to the cause.
- **Site checks.** Some problems only show across pages, such as duplicate titles or a page that is missing from the sitemap.
- **Typed config.** `seolint.config.ts` checks rule names and options as you type.
- **Your own rules.** [Plugins](/docs/plugins/) use the same API as the built-in rules.
- **Fast.** Large sites lint in worker threads.

## Next steps

- Follow the [quickstart](/docs/quickstart/) to lint your first build.
- [Install](/docs/install/) seolint in your project.
- Read the [rules reference](/docs/rules/) to see what each rule checks.
