# seolint

> A robust and configurable SEO linter

seolint checks the HTML of a built site, or of live URLs, for SEO problems: titles, descriptions, canonical links, headings, links, images, social tags, and more. Some checks span the whole site, such as duplicate titles, broken links, and pages missing from the sitemap.

- **70 rules**, each with its own page in [the rules reference](https://seolint.io/docs/rules/).
- **Configurable** in `seolint.config.ts`, with type-checked rule names and options.
- **Extensible** with your own plugins and/or presets, for one page or for the whole site.
- **CI-ready**, with exit codes, JSON output, and inline annotations for GitHub Actions.

## Install

```sh
$ npm install --save-dev seolint
```

seolint needs Node 22.8 or later, or Bun.

## Usage

Lint the output folder of your site generator:

```sh
$ seolint public --host https://example.com
```

```txt
 FAIL  public/about/index.html
         ✘  A "meta[name=description]" must exist       description.exists
    6:2  ✘  Must not have less than 10 characters       title.content.length
  21:52  ⚠  Must describe the target, not "click here"  link.text.vague

 FAIL  Reported 2 errors and 1 warning!
```

## Documentation

Read the docs at **[seolint.io](https://seolint.io/docs/)**:

- [Install](https://seolint.io/docs/install/) and [Quickstart](https://seolint.io/docs/quickstart/)
- [CLI](https://seolint.io/docs/cli/) and [Configuration](https://seolint.io/docs/config/)
- [CI](https://seolint.io/docs/ci/), [Plugins](https://seolint.io/docs/plugins/), and [API](https://seolint.io/docs/api/)
- [Rules](https://seolint.io/docs/rules/) and [Presets](https://seolint.io/docs/presets/)

See [`example/`](example) for a site with custom plugins.

## Credits

Originally written by [@nickreese](https://github.com/nickreese) to audit [Elder Guide](https://elderguide.com/).

## License

MIT © [Nick Reese](https://nicholasreese.com) · [Luke Edwards](https://lukeed.com)
