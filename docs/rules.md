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
- **Patterns:** a name with `*` sets every rule that matches. Patterns apply first, then exact names, so `{ "og.*": false, "og.title": true }` keeps only `og.title`.
- **Unknown names** are an error, so a typo does not go unnoticed. `define()` also checks rule names and options as you type.
- **The page URL:** some rules compare against the page's own URL. For a file, it is the `host` plus the file's path, without `index.html`. Without a `host`, these rules are skipped.

Run `seolint --rules` to list every rule with its current setting.

## Contents

- [html](#html): [`html.doctype`](#htmldoctype), [`html.lang`](#htmllang), [`html.charset`](#htmlcharset), [`html.favicon`](#htmlfavicon)
- [title](#title): [`title.exists`](#titleexists), [`title.single`](#titlesingle), [`title.content.html`](#titlecontenthtml), [`title.content.undefined`](#titlecontentundefined), [`title.content.null`](#titlecontentnull), [`title.content.length`](#titlecontentlength)
- [description](#description): [`description.exists`](#descriptionexists), [`description.single`](#descriptionsingle), [`description.content.empty`](#descriptioncontentempty), [`description.content.html`](#descriptioncontenthtml), [`description.content.title`](#descriptioncontenttitle), [`description.content.undefined`](#descriptioncontentundefined), [`description.content.null`](#descriptioncontentnull), [`description.content.length`](#descriptioncontentlength)
- [canonical](#canonical): [`canonical.exists`](#canonicalexists), [`canonical.single`](#canonicalsingle), [`canonical.head`](#canonicalhead), [`canonical.href.exists`](#canonicalhrefexists), [`canonical.href.absolute`](#canonicalhrefabsolute), [`canonical.href.lowercase`](#canonicalhreflowercase), [`canonical.href.https`](#canonicalhrefhttps), [`canonical.href.match`](#canonicalhrefmatch), [`canonical.href.self`](#canonicalhrefself)
- [viewport](#viewport): [`viewport.exists`](#viewportexists), [`viewport.single`](#viewportsingle), [`viewport.content.empty`](#viewportcontentempty), [`viewport.content.device`](#viewportcontentdevice), [`viewport.content.scale`](#viewportcontentscale), [`viewport.content.zoom`](#viewportcontentzoom)
- [heading](#heading): [`heading.exists`](#headingexists), [`heading.single`](#headingsingle), [`heading.order`](#headingorder)
- [robots](#robots): [`robots.noindex`](#robotsnoindex), [`robots.nofollow`](#robotsnofollow)
- [image](#image): [`image.alt.exists`](#imagealtexists), [`image.alt.content.html`](#imagealtcontenthtml), [`image.alt.content.undefined`](#imagealtcontentundefined), [`image.alt.content.null`](#imagealtcontentnull)
- [link](#link): [`link.href.exists`](#linkhrefexists), [`link.href.empty`](#linkhrefempty), [`link.text.exists`](#linktextexists), [`link.text.vague`](#linktextvague), [`link.internal.trailing`](#linkinternaltrailing), [`link.internal.lowercase`](#linkinternallowercase), [`link.internal.nofollow`](#linkinternalnofollow), [`link.internal.pretty`](#linkinternalpretty), [`link.internal.absolute`](#linkinternalabsolute), [`link.internal.https`](#linkinternalhttps), [`link.external.limit`](#linkexternallimit), [`link.blank.noopener`](#linkblanknoopener), [`link.blank.noreferrer`](#linkblanknoreferrer)
- [mixed](#mixed): [`mixed.content`](#mixedcontent)
- [hreflang](#hreflang): [`hreflang.code`](#hreflangcode), [`hreflang.absolute`](#hreflangabsolute), [`hreflang.default`](#hreflangdefault)
- [og](#og): [`og.title`](#ogtitle), [`og.description`](#ogdescription), [`og.image`](#ogimage), [`og.image.secure`](#ogimagesecure), [`og.url`](#ogurl)
- [twitter](#twitter): [`twitter.card`](#twittercard)
- [site](#site): [`site.title.unique`](#sitetitleunique), [`site.description.unique`](#sitedescriptionunique), [`site.link.exists`](#sitelinkexists), [`site.robots`](#siterobots), [`site.sitemap`](#sitesitemap)

## html

Rules about the document as a whole.

### `html.doctype`

A page starts with `<!doctype html>`.

**Default:** `error`

**Why:** Without the doctype, browsers render the page in quirks mode, which changes the layout and can hide content.

**When off:** pages without a doctype pass.

```html
<!-- ✗ Fails -->
<html lang="en">
  ...
</html>

<!-- ✓ Passes -->
<!doctype html>
<html lang="en">
  ...
</html>
```

### `html.lang`

The `<html>` element has a `lang` attribute.

**Default:** `error`

**Why:** Search engines and screen readers use `lang` to know the page language, which helps them serve the page to the right people and read it aloud correctly.

**When off:** pages without a language pass.

```html
<!-- ✗ Fails -->
<html>
  <!-- ✓ Passes -->
  <html lang="en"></html>
</html>
```

### `html.charset`

A page declares its character encoding near the top.

**Default:** `error`

**Why:** Without a declared encoding, browsers and crawlers guess, and can show text as garbled characters. The HTML spec requires the declaration within the first 1024 bytes, so this rule also fails when it comes later.

**When off:** pages without, or with a late, encoding pass.

```html
<!-- ✗ Fails -->
<head>
  <title>Home</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta charset="utf-8" />
  <title>Home</title>
</head>
```

### `html.favicon`

A page links to a favicon.

**Default:** `warn`

**Why:** Search results and browser tabs show the favicon next to your page. Without one, they show a generic icon.

**When off:** pages without a favicon pass.

```html
<!-- ✗ Fails -->
<head>
  <title>Home</title>
</head>

<!-- ✓ Passes -->
<head>
  <link rel="icon" href="/favicon.svg" />
</head>
```

## title

Rules about the `<title>` element, which search results show as the link text.

### `title.exists`

A page has a `<title>` element in its `<head>`.

**Default:** `error`

**Why:** Search engines show the title as the link text in results. Without one, they make up a title from the page content.

**When off:** pages without a title pass.

```html
<!-- ✗ Fails -->
<head></head>

<!-- ✓ Passes -->
<head>
  <title>Fresh bread every morning</title>
</head>
```

### `title.single`

A page has only one `<title>` element.

**Default:** `error`

**Why:** With more than one title, search engines pick one, and may not pick the one you want.

**When off:** pages with many titles pass.

```html
<!-- ✗ Fails -->
<title>Home</title>
<title>Bongo Bakery</title>

<!-- ✓ Passes -->
<title>Bongo Bakery</title>
```

### `title.content.html`

The title has no HTML tags in its text.

**Default:** `error`

**Why:** A `<title>` holds plain text. Tags inside it show up as literal text, such as `<b>`, in search results and browser tabs. Entities such as `&amp;` are fine.

**When off:** titles with tags pass.

```html
<!-- ✗ Fails -->
<title>Fresh <b>bread</b></title>

<!-- ✓ Passes -->
<title>Fish &amp; Chips</title>
```

### `title.content.undefined`

The title does not include the text `undefined`.

**Default:** `error`

**Why:** `undefined` in a title is almost always a template bug, such as a missing variable.

**When off:** titles with `undefined` pass.

```html
<!-- ✗ Fails -->
<title>undefined | Bongo Bakery</title>

<!-- ✓ Passes -->
<title>About | Bongo Bakery</title>
```

### `title.content.null`

The title does not include the text `null`.

**Default:** `error`

**Why:** `null` in a title is almost always a template bug, such as an empty value.

**When off:** titles with `null` pass.

```html
<!-- ✗ Fails -->
<title>null</title>

<!-- ✓ Passes -->
<title>About us</title>
```

### `title.content.length`

The title length is within a range of characters.

**Default:** `error`, with options `{"min":10,"max":60}`

**Why:** Search results cut off titles at about 60 characters, and very short titles say little about the page.

**When off:** titles of any length pass.

| Option | Type     | Default | Description                    |
| ------ | -------- | ------- | ------------------------------ |
| `min`  | `number` | `10`    | The fewest characters allowed. |
| `max`  | `number` | `60`    | The most characters allowed.   |

```html
<!-- ✗ Fails -->
<title>Home</title>

<!-- ✓ Passes -->
<title>Fresh bread every morning</title>
```

```ts
rules: { "title.content.length": { max: 70 } }
```

## description

Rules about `<meta name="description">`, which search results often show below the title.

### `description.exists`

A page has a `<meta name="description">` tag.

**Default:** `error`

**Why:** Search engines often show the description below the title. Without one, they pick a piece of the page text, which may not describe the page well.

**When off:** pages without a description pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta
    name="description"
    content="Who we are, and how we bake our bread every morning."
  />
</head>
```

### `description.single`

A page has only one description tag.

**Default:** `error`

**Why:** With more than one description, search engines pick one, and may not pick the one you want.

**When off:** pages with many descriptions pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="Our bakery." />
<meta name="description" content="Fresh bread every morning." />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

### `description.content.empty`

The description is not empty.

**Default:** `error`

**Why:** An empty description is the same as no description, and usually means a template left out a value.

**When off:** empty descriptions pass.

```html
<!-- ✗ Fails -->
<meta name="description" content=" " />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

### `description.content.html`

The description has no HTML tags in its text.

**Default:** `error`

**Why:** A description holds plain text. Tags in it, such as an escaped `&lt;b&gt;`, show up as literal text in search results.

**When off:** descriptions with tags pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="Our &lt;b&gt;best&lt;/b&gt; bread." />

<!-- ✓ Passes -->
<meta name="description" content="Our best bread." />
```

### `description.content.title`

The description shares at least one meaningful word with the title.

**Default:** `warn`

**Why:** A description that shares no words with the title may belong to another page. Common words such as "the" and "and" do not count.

**When off:** any description passes.

```html
<!-- ✗ Fails -->
<title>The Bakery</title>
<meta name="description" content="The shop in town." />

<!-- ✓ Passes -->
<title>The Bakery</title>
<meta name="description" content="Our bakery bakes bread every morning." />
```

### `description.content.undefined`

The description does not include the text `undefined`.

**Default:** `error`

**Why:** `undefined` in a description is almost always a template bug, such as a missing variable.

**When off:** descriptions with `undefined` pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="undefined" />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

### `description.content.null`

The description does not include the text `null`.

**Default:** `error`

**Why:** `null` in a description is almost always a template bug, such as an empty value.

**When off:** descriptions with `null` pass.

```html
<!-- ✗ Fails -->
<meta name="description" content="null" />

<!-- ✓ Passes -->
<meta name="description" content="Fresh bread every morning." />
```

### `description.content.length`

The description length is within a range of characters.

**Default:** `error`, with options `{"min":50,"max":160}`

**Why:** Search results cut off descriptions at about 155 to 160 characters, and short descriptions say little about the page.

**When off:** descriptions of any length pass.

| Option | Type     | Default | Description                    |
| ------ | -------- | ------- | ------------------------------ |
| `min`  | `number` | `50`    | The fewest characters allowed. |
| `max`  | `number` | `160`   | The most characters allowed.   |

```html
<!-- ✗ Fails -->
<meta name="description" content="Our bakery." />

<!-- ✓ Passes -->
<meta
  name="description"
  content="Bongo Bakery bakes fresh bread, buns, and pastries every morning in the heart of town."
/>
```

```ts
rules: { "description.content.length": { min: 70, max: 155 } }
```

## canonical

Rules about `<link rel="canonical">`, which tells search engines the main URL of a page.

### `canonical.exists`

A page has a `<link rel="canonical">` tag.

**Default:** `error`

**Why:** The same page is often reachable at many URLs, such as with tracking parameters. The canonical link tells search engines which URL to show, so the others do not compete with it.

**When off:** pages without a canonical link pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <link rel="canonical" href="https://example.com/about/" />
</head>
```

### `canonical.single`

A page has only one canonical link.

**Default:** `error`

**Why:** With more than one canonical link, search engines may ignore all of them.

**When off:** pages with many canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/about/" />
<link rel="canonical" href="https://example.com/about-us/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

### `canonical.head`

The canonical link is inside `<head>`.

**Default:** `error`

**Why:** Search engines ignore a canonical link in `<body>`.

**When off:** canonical links anywhere pass.

```html
<!-- ✗ Fails -->
<body>
  <link rel="canonical" href="https://example.com/about/" />
</body>

<!-- ✓ Passes -->
<head>
  <link rel="canonical" href="https://example.com/about/" />
</head>
```

### `canonical.href.exists`

The canonical link has a non-empty `href`.

**Default:** `error`

**Why:** An empty canonical link points nowhere, and usually means a template left out a value.

**When off:** empty canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

### `canonical.href.absolute`

The canonical `href` is an absolute URL.

**Default:** `error`

**Why:** Search engines may resolve a relative canonical link differently than you expect, such as against another domain that serves the same page.

**When off:** relative canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

### `canonical.href.lowercase`

The canonical `href` has no uppercase letters.

**Default:** `error`

**Why:** URL paths are case-sensitive, so `/About/` and `/about/` are different URLs. Lowercase URLs avoid two versions of one page.

**When off:** canonical links with uppercase letters pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/About/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

### `canonical.href.https`

The canonical `href` uses `https://`.

**Default:** `error`

**Why:** Search engines prefer `https://` pages. A canonical link to `http://` asks them to show the insecure version.

**When off:** `http://` canonical links pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="http://example.com/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

### `canonical.href.match`

The canonical `href` includes the site hostname.

**Default:** `error`, with options `{"hostname":""}`

**Why:** A canonical link to another site hands your page's ranking to that site. This is often a copy-paste mistake.

**When off:** canonical links to any site pass.

| Option     | Type     | Default | Description                                                                     |
| ---------- | -------- | ------- | ------------------------------------------------------------------------------- |
| `hostname` | `string` | `""`    | The hostname to require. When empty, the rule uses the `host` from your config. |

```html
<!-- With host "https://example.com" -->

<!-- ✗ Fails -->
<link rel="canonical" href="https://other.com/about/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

```ts
rules: { "canonical.href.match": { hostname: "www.example.com" } }
```

### `canonical.href.self`

The canonical `href` points at the page itself.

**Default:** `warn`

**Why:** A canonical link to another page asks search engines to show that page instead of this one. That is right for duplicates, such as print versions, but is often a template mistake that hides real pages. The rule needs the page URL, so it is skipped without a `host`.

**When off:** canonical links to other pages pass.

```html
<!-- On https://example.com/about/ -->

<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
```

## viewport

Rules about `<meta name="viewport">`, which controls how a page fits on phones.

### `viewport.exists`

A page has a `<meta name="viewport">` tag.

**Default:** `error`

**Why:** Without it, phones show the page at desktop width, zoomed out. Search engines rank pages that are not mobile-friendly lower.

**When off:** pages without a viewport pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
```

### `viewport.single`

A page has only one viewport tag.

**Default:** `error`

**Why:** With more than one viewport tag, browsers use only one, which may not be the one you want.

**When off:** pages with many viewport tags pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="width=device-width" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### `viewport.content.empty`

The viewport `content` is not empty.

**Default:** `error`

**Why:** An empty viewport is the same as no viewport.

**When off:** empty viewports pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### `viewport.content.device`

The viewport `content` includes `width=device-width`.

**Default:** `error`

**Why:** Without `width=device-width`, phones lay out the page at a fixed width instead of the screen width.

**When off:** viewports without it pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="initial-scale=1" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### `viewport.content.scale`

The viewport `content` includes `initial-scale=1`.

**Default:** `error`

**Why:** Without `initial-scale=1`, some phones zoom the page when it loads, or when the device turns.

**When off:** viewports without it pass.

```html
<!-- ✗ Fails -->
<meta name="viewport" content="width=device-width" />

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### `viewport.content.zoom`

The viewport does not stop users from zooming.

**Default:** `error`

**Why:** `user-scalable=no`, or a `maximum-scale` below 2, stops people from zooming in to read. This fails accessibility checks, such as Lighthouse.

**When off:** viewports that block zoom pass.

```html
<!-- ✗ Fails -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, user-scalable=no"
/>

<!-- ✓ Passes -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## heading

Rules about headings, which show search engines how a page is organized.

### `heading.exists`

A page has an `<h1>`.

**Default:** `error`

**Why:** The `<h1>` names the main topic of the page. Search engines and screen readers rely on it.

**When off:** pages without an `<h1>` pass.

```html
<!-- ✗ Fails -->
<body>
  <h2>Our bread</h2>
</body>

<!-- ✓ Passes -->
<body>
  <h1>Our bread</h1>
</body>
```

### `heading.single`

A page has only one `<h1>`.

**Default:** `error`

**Why:** More than one `<h1>` makes the main topic of the page unclear.

**When off:** pages with many `<h1>` elements pass.

```html
<!-- ✗ Fails -->
<h1>Contact us</h1>
<h1>Opening hours</h1>

<!-- ✓ Passes -->
<h1>Contact us</h1>
<h2>Opening hours</h2>
```

### `heading.order`

Headings do not skip levels, such as an `<h4>` after an `<h2>`.

**Default:** `warn`

**Why:** Skipped levels break the outline of the page, which search engines and screen readers use to understand how sections relate.

**When off:** headings in any order pass.

```html
<!-- ✗ Fails -->
<h1>Our sourdough</h1>
<h3>Ingredients</h3>

<!-- ✓ Passes -->
<h1>Our sourdough</h1>
<h2>Ingredients</h2>
```

## robots

Rules about `<meta name="robots">` and `<meta name="googlebot">`.

### `robots.noindex`

A page does not ask search engines to leave it out of results.

**Default:** `error`

**Why:** `noindex`, or `none`, removes the page from search results. It is often left over from a staging site.

**When off:** pages with `noindex` pass. Turn the rule off for sites, or pages, that you do not want in search results.

```html
<!-- ✗ Fails -->
<meta name="robots" content="noindex" />

<!-- ✓ Passes -->
<meta name="robots" content="index, follow" />
```

### `robots.nofollow`

A page does not ask search engines to ignore its links.

**Default:** `error`

**Why:** `nofollow`, or `none`, stops search engines from following the page's links, so the pages it links to are found and ranked less.

**When off:** pages with `nofollow` pass.

```html
<!-- ✗ Fails -->
<meta name="robots" content="nofollow" />

<!-- ✓ Passes -->
<meta name="robots" content="index, follow" />
```

## image

Rules about `<img>` elements.

### `image.alt.exists`

An `<img>` has an `alt` attribute.

**Default:** `error`

**Why:** Search engines and screen readers use `alt` text to understand images. An empty `alt=""` is allowed: it marks a decorative image that should be skipped.

**When off:** images without `alt` pass.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="A basket of fresh bread" />
<img src="/divider.svg" alt="" />
```

### `image.alt.content.html`

The `alt` text has no HTML tags.

**Default:** `error`

**Why:** `alt` holds plain text. Tags in it are read out as literal text.

**When off:** `alt` text with tags passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="&lt;b&gt;Bread&lt;/b&gt;" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```

### `image.alt.content.undefined`

The `alt` text does not include the text `undefined`.

**Default:** `error`

**Why:** `undefined` in `alt` text is almost always a template bug, such as a missing variable.

**When off:** `alt` text with `undefined` passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="undefined" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```

### `image.alt.content.null`

The `alt` text does not include the text `null`.

**Default:** `error`

**Why:** `null` in `alt` text is almost always a template bug, such as an empty value.

**When off:** `alt` text with `null` passes.

```html
<!-- ✗ Fails -->
<img src="/bread.jpg" alt="null" />

<!-- ✓ Passes -->
<img src="/bread.jpg" alt="Bread" />
```

## link

Rules about `<a>` elements. A link is internal when its hostname matches the `host`, or when it is relative. Without a `host`, every link counts as external, so the `link.internal.*` rules are skipped. Except for `link.href.exists` and the `link.text.*` rules, links to `#`, `mailto:`, and `javascript:` are skipped, and each `href` is checked once per page.

### `link.href.exists`

A link has an `href` attribute.

**Default:** `error`

**Why:** An `<a>` without `href` is not a link, so search engines do not follow it, and keyboards cannot reach it.

**When off:** links without `href` pass.

```html
<!-- ✗ Fails -->
<a onclick="go()">Menu</a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
```

### `link.href.empty`

A link `href` is not empty.

**Default:** `error`

**Why:** An empty `href` points back to the same page, which is almost always a template bug.

**When off:** empty links pass.

```html
<!-- ✗ Fails -->
<a href="">Menu</a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
```

### `link.text.exists`

A link has text, an `aria-label`, or an image with `alt` text.

**Default:** `error`

**Why:** Search engines use link text to learn what the target page is about, and screen readers read it aloud. A link without text says nothing.

**When off:** links without text pass.

```html
<!-- ✗ Fails -->
<a href="/menu/"><img src="/menu.svg" alt="" /></a>

<!-- ✓ Passes -->
<a href="/menu/">Menu</a>
<a href="/menu/" aria-label="Menu"><img src="/menu.svg" alt="" /></a>
```

### `link.text.vague`

A link text describes its target, unlike "click here".

**Default:** `warn`, with options `{"words":["click here","here","read more","more","learn more","link","this"]}`

**Why:** Search engines use link text to learn what the target page is about. "Click here" tells them nothing. The check ignores case and punctuation.

**When off:** vague link text passes.

| Option  | Type       | Default   | Description                                                           |
| ------- | ---------- | --------- | --------------------------------------------------------------------- |
| `words` | `string[]` | see above | The link texts to report, in lowercase. Setting it replaces the list. |

```html
<!-- ✗ Fails -->
<a href="/menu/">Click here</a>

<!-- ✓ Passes -->
<a href="/menu/">See our full menu</a>
```

```ts
rules: { "link.text.vague": { words: ["click here", "here", "go"] } }
```

### `link.internal.trailing`

An internal link to a page ends with a slash.

**Default:** `error`

**Why:** `/about` and `/about/` are different URLs. One of them usually redirects to the other, which costs a request, and both may get indexed. A link to a file, with an extension such as `/menu.pdf`, is fine. The query and hash are ignored.

**When off:** links without a trailing slash pass.

```html
<!-- ✗ Fails -->
<a href="/about">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
<a href="/menu.pdf">Menu</a>
```

### `link.internal.lowercase`

An internal link has no uppercase letters.

**Default:** `error`

**Why:** URL paths are case-sensitive, so `/About/` and `/about/` are different URLs, and one of them may not exist.

**When off:** links with uppercase letters pass.

```html
<!-- ✗ Fails -->
<a href="/About/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `link.internal.nofollow`

An internal link does not use `rel="nofollow"`.

**Default:** `error`

**Why:** `nofollow` on your own links stops search engines from following them, so your own pages are found and ranked less.

**When off:** internal `nofollow` links pass.

```html
<!-- ✗ Fails -->
<a href="/about/" rel="nofollow">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `link.internal.pretty`

An internal link does not end with `.html`.

**Default:** `error`

**Why:** `/about.html` and `/about/` can both serve the same page, which splits its ranking. Clean URLs also read better in results.

**When off:** links that end with `.html` pass.

```html
<!-- ✗ Fails -->
<a href="/about.html">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `link.internal.absolute`

An internal link starts with `/`, `//`, or a protocol.

**Default:** `error`

**Why:** A relative link, such as `about/`, resolves against the current page, so it breaks when the page moves.

**When off:** relative links pass.

```html
<!-- ✗ Fails -->
<a href="about/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `link.internal.https`

An internal link uses `https://`, or a root-relative path.

**Default:** `error`

**Why:** An `http://` link to your own site forces a redirect to `https://`, or serves an insecure page.

**When off:** internal `http://` links pass.

```html
<!-- ✗ Fails -->
<a href="http://example.com/about/">About</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `link.external.limit`

A page has at most a number of external links.

**Default:** `warn`, with options `{"max":50}`

**Why:** A page with very many external links looks like a link farm to search engines, and passes little value to each link.

**When off:** any number of external links passes.

| Option | Type     | Default | Description                                  |
| ------ | -------- | ------- | -------------------------------------------- |
| `max`  | `number` | `50`    | The most external links allowed on one page. |

```ts
rules: { "link.external.limit": { max: 20 } }
```

### `link.blank.noopener`

A link with `target="_blank"` uses `rel="noopener"`.

**Default:** `error`

**Why:** Without `noopener`, the opened page can control yours through `window.opener`, such as to redirect it to a phishing page.

**When off:** `target="_blank"` links without `noopener` pass.

```html
<!-- ✗ Fails -->
<a href="https://other.com/" target="_blank">Recipe</a>

<!-- ✓ Passes -->
<a href="https://other.com/" target="_blank" rel="noopener noreferrer"
  >Recipe</a
>
```

### `link.blank.noreferrer`

A link with `target="_blank"` uses `rel="noreferrer"`.

**Default:** `error`

**Why:** Without `noreferrer`, the opened page learns which page sent the visitor. `noreferrer` also implies `noopener` in older browsers.

**When off:** `target="_blank"` links without `noreferrer` pass.

```html
<!-- ✗ Fails -->
<a href="https://other.com/" target="_blank" rel="noopener">Recipe</a>

<!-- ✓ Passes -->
<a href="https://other.com/" target="_blank" rel="noopener noreferrer"
  >Recipe</a
>
```

## mixed

### `mixed.content`

An `https://` page loads no resources over `http://`.

**Default:** `error`

**Why:** Browsers block, or warn about, insecure images, scripts, and styles on secure pages, so the page breaks or shows a "not secure" warning. The rule checks `src`, `srcset`, `href`, `poster`, and `data` on images, sources, scripts, stylesheets and other links, frames, media, embeds, and objects. Canonical and alternate links are left to their own rules. It runs when the page URL, or else the `host`, uses `https://`.

**When off:** insecure resources pass.

```html
<!-- On https://example.com/ -->

<!-- ✗ Fails -->
<img src="http://example.com/oven.jpg" alt="Our oven" />

<!-- ✓ Passes -->
<img src="https://example.com/oven.jpg" alt="Our oven" />
<img src="/oven.jpg" alt="Our oven" />
```

## hreflang

Rules about `<link rel="alternate" hreflang>`, which point search engines to translated versions of a page. They only run on pages with such links.

### `hreflang.code`

An `hreflang` value is a valid language code, or `x-default`.

**Default:** `error`

**Why:** Search engines ignore alternate links with an invalid code, such as `english`. A code is a language, with an optional script and region, such as `en`, `zh-Hant`, or `pt-BR`.

**When off:** any `hreflang` value passes.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="english" href="https://example.com/en/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
```

### `hreflang.absolute`

An `hreflang` link uses an absolute URL.

**Default:** `error`

**Why:** Search engines require absolute URLs in alternate links.

**When off:** relative alternate links pass.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="en" href="/en/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
```

### `hreflang.default`

Pages with `hreflang` links also have an `x-default` link.

**Default:** `warn`

**Why:** `x-default` names the page to show visitors whose language matches none of the alternates.

**When off:** alternate links without `x-default` pass.

```html
<!-- ✗ Fails -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="de" href="https://example.com/de/" />

<!-- ✓ Passes -->
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="de" href="https://example.com/de/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

## og

Rules about Open Graph tags, which social networks and chat apps use for link previews. They do not change search ranking, so they default to `warn`. Set `"og.*": "error"` to require them.

### `og.title`

A page has an `og:title`.

**Default:** `warn`

**Why:** Link previews show the `og:title` as their heading. Without it, apps guess from the page.

**When off:** pages without `og:title` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:title" content="About Bongo Bakery" />
</head>
```

### `og.description`

A page has an `og:description`.

**Default:** `warn`

**Why:** Link previews show the `og:description` below the title.

**When off:** pages without `og:description` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:description" content="Who we are, and how we bake." />
</head>
```

### `og.image`

A page has an `og:image`.

**Default:** `warn`

**Why:** Link previews with an image get more attention than plain links.

**When off:** pages without `og:image` pass.

```html
<!-- ✗ Fails -->
<head>
  <title>About us</title>
</head>

<!-- ✓ Passes -->
<head>
  <meta property="og:image" content="https://example.com/og/about.png" />
</head>
```

### `og.image.secure`

The `og:image` is an absolute `https://` URL.

**Default:** `warn`

**Why:** Many apps only load preview images from absolute `https://` URLs, so a relative or `http://` image does not show.

**When off:** any `og:image` URL passes.

```html
<!-- ✗ Fails -->
<meta property="og:image" content="/og/about.png" />

<!-- ✓ Passes -->
<meta property="og:image" content="https://example.com/og/about.png" />
```

### `og.url`

A page has an `og:url` that matches its canonical URL.

**Default:** `warn`

**Why:** Apps use `og:url` to group shares of the same page. When it differs from the canonical URL, shares of one page are counted apart. Without a canonical link, the rule compares against the page URL, when it is known.

**When off:** pages without, or with a different, `og:url` pass.

```html
<!-- ✗ Fails -->
<link rel="canonical" href="https://example.com/about/" />
<meta property="og:url" content="https://example.com/about-us/" />

<!-- ✓ Passes -->
<link rel="canonical" href="https://example.com/about/" />
<meta property="og:url" content="https://example.com/about/" />
```

## twitter

### `twitter.card`

A page has a valid `twitter:card`.

**Default:** `warn`

**Why:** X, formerly Twitter, uses `twitter:card` to choose the layout of a link preview. Without a valid value, it shows a plain link. The valid values are `summary`, `summary_large_image`, `app`, and `player`.

**When off:** pages without, or with an invalid, `twitter:card` pass.

```html
<!-- ✗ Fails -->
<meta name="twitter:card" content="big" />

<!-- ✓ Passes -->
<meta name="twitter:card" content="summary_large_image" />
```

## site

Rules that compare pages across the whole site. They run when you lint a folder, or URLs, with `seolint public` or `run()`. They do not run for `lint()`, which checks one page.

- `site.title.unique` and `site.description.unique` run for files and URLs.
- `site.link.exists`, `site.robots`, and `site.sitemap` need the built files, so they only run for folders, which they treat as site roots. `site.link.exists`, and the page check of `site.sitemap`, also need a `host`.

### `site.title.unique`

Every page has a different title.

**Default:** `error`

**Why:** Search engines use titles to tell pages apart. When two pages share a title, they compete for the same searches, and one may be left out of results. Case is ignored.

**When off:** duplicate titles pass.

```html
<!-- ✗ Fails -->
<!-- index.html -->
<title>Bongo Bakery</title>
<!-- about/index.html -->
<title>Bongo Bakery</title>

<!-- ✓ Passes -->
<!-- index.html -->
<title>Bongo Bakery, fresh bread every morning</title>
<!-- about/index.html -->
<title>About Bongo Bakery</title>
```

### `site.description.unique`

Every page has a different description.

**Default:** `error`

**Why:** A description that repeats across pages tells search engines nothing about each page, so they often replace it with page text. Case is ignored.

**When off:** duplicate descriptions pass.

```html
<!-- ✗ Fails -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Fresh bread every morning." />

<!-- ✓ Passes -->
<!-- index.html -->
<meta name="description" content="Fresh bread every morning." />
<!-- contact/index.html -->
<meta name="description" content="Call, write, or visit us." />
```

### `site.link.exists`

Internal links point to files that exist in the build.

**Default:** `error`

**Why:** Broken links waste crawl time, lose the value they would pass on, and frustrate visitors. A link to `/about/` passes when `about/index.html` exists. A link to `/about` passes when `about`, `about/index.html`, or `about.html` exists. The query and hash are ignored.

**When off:** broken internal links pass.

```html
<!-- ✗ Fails, when there is no menu/index.html -->
<a href="/menu/">Menu</a>

<!-- ✓ Passes -->
<a href="/about/">About</a>
```

### `site.robots`

A `robots.txt` exists, and does not block every crawler.

**Default:** `warn`

**Why:** Crawlers read `robots.txt` first. A missing file is fine for them, but often means it was left out of the build. A `Disallow: /` for `User-agent: *` blocks the whole site, which is often left over from a staging site.

**When off:** a missing or blocking `robots.txt` passes.

```txt
# ✗ Fails
User-agent: *
Disallow: /

# ✓ Passes
User-agent: *
Allow: /
```

### `site.sitemap`

A `sitemap.xml` exists, and lists every page.

**Default:** `warn`

**Why:** A sitemap helps search engines find every page, including pages that few links point to. A page missing from it may be found late, or not at all. Pages are matched by their URL, from the `host` and the file path.

**When off:** a missing sitemap, or missing pages, pass.

```xml
<!-- ✓ Passes, for a site with these two pages -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url><loc>https://example.com/</loc></url>
	<url><loc>https://example.com/about/</loc></url>
</urlset>
```
