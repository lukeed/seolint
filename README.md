# `seo-lint`: A Robust SEO Linter / Checker for Local HTML Files

This package offers both a CLI and a library to help you with linting HTML for over 50 common SEO issues.

This SEO tool was spun out of [Elder.js'](https://elderguide.com/tech/elderjs/) plugin called [seo-check](https://github.com/Elderjs/plugins/tree/master/packages/seo-check).

```sh
$ npm i -g  @nickreese/seo-lint
```

## CLI

**Usage:**

```sh
seo-lint <dir> [options]
```

**Options**

- `-H`, `--host` Set the expected host for internal links. (example.com)
- `-v`, `--version` Displays current version

## Tester

The library exports a `Tester` class which has 2 methods: `folder` and `test`.

### Recursive Folder Linting: `folder`

If you have a folder of `.html` files you're looking to check for common SEO issues, you just need to specify the folder and seo-lint will recursively check all of the .html files for issues.

```js
const { Tester } = require('./Tester');
const tester = new Tester({ siteWide: true, host: 'example.com' });
const results = await tester.folder('public'); // relative to process.cwd()
```

### Raw HTML Linting: `test`

If you have a build process that generates HTML, such as a static site generator, and want to lint that html generated for common SEO issues you can do the following:

```js
const { Tester } = require('./Tester');
const tester = new Tester({ host: 'example.com' });
const results = await test(html, relPermalink);

// results will be an object with issues by url and sitewide issues.
```

## Checks

### Sitewide

These are only checked when Elder.js runs in build mode.

- [x] check for orphaned pages (no incoming internal links)
- [x] check for broken internal links.
- [x] check for duplicate title tags
- [x] check for duplicate meta descriptions

### Canonical

- [x] canonical tag exists
- [x] canonical tag matches `request.permalink`

### Title Tag

- [x] Title tag exists
- [x] Title tag `innerText` and `innerHTML` are the same. (no
      html tags in your title tag)
- [x] Only one title tag per page
- [x] Title tag is less than 70 chars
- [x] Title tag is more than 10 chars
- [x] Title doesn't include common stopwords.
- [x] Title tag doesn't have `null`
- [x] Title tag doesn't have `undefined`
- [x] checks for stop words.

### Meta Description

- [x] meta description exists
- [x] only one meta description tag per page
- [x] Meta description doesn't have `null`
- [x] Meta description doesn't have `undefined`
- [x] Meta description is longer than 10 chars
- [x] Meta description is less than than 120 chars
- [x] Meta description is longer than 300 chars (sometimes things
      go REALLY wrong and this helps catch it.)
- [x] Meta description includes at least one the keywords of the title
      tag.

### HTags

- [x] h1 Exists on page
- [x] only a single h1 per page.
- [x] h1 has at least one word from your title tag
- [x] h1 is less than 70 chars
- [x] h1 is more than than 10 chars
- [x] H2 or H3 don't exist if an H1 is missing.
- [x] H2 exists on the page
- [x] h2 is less than 100 chars
- [x] h2 is more than than 10 chars
- [x] At least one of your h2s contains a single word from your
      title tag.
- [x] h3 is less than 100 chars
- [x] h3 is more than than 7 chars
- [x] h4 is less than 100 chars
- [x] h4 is more than than 7 chars
- [x] If no h2s checks for h3s.
- [x] If no h3s checks for h4s.
- [x] If no h4s checks for h5s.
- [x] If no h5s checks for h6s.

### Images

- [x] Checks images for alt tags.

### Links

- [x] Internal links are lowercase
- [x] Internal links have trailing slash
- [x] Internal links are not `nofollow`
- [x] Notifies if there are more than 50 outbound links on the page.
- [x] check for trailing `index.html`
- [x] internal fully formed links include 'https'

### Misc

- [x] Checks for `width=device-width, initial-scale=1.0` meta
      viewport.

## Credits:

Written by <a href="https://nicholasreese.com">Nick Reese</a>. Initially written to audit [Elder Guide](https://elderguide.com/).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
