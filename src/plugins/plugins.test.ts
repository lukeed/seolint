import { describe, expect, test } from "bun:test";

import * as seolint from "../index";

import type { Setting } from "../types";

const HOST = "https://example.com";

/**
 * Lint `body` inside a minimal page with only `rule` turned on, and return
 * the messages of that rule.
 */
async function check(
	rule: string,
	html: string,
	options: { setting?: Setting; url?: string; host?: string } = {},
): Promise<string[]> {
	let config = {
		host: options.host ?? HOST,
		rules: { "*": false, [rule]: options.setting ?? true },
	};
	let output = await seolint.lint(html, config, options.url);
	return (output ?? []).map((x) => x.message);
}

function page(head: string, body = ""): string {
	return `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
}

describe("html", () => {
	test("html.doctype", async () => {
		expect(await check("html.doctype", page(""))).toEqual([]);
		expect(await check("html.doctype", "<html></html>")).toHaveLength(1);
		expect(
			await check("html.doctype", "<!doctype xhtml><html></html>"),
		).toHaveLength(1);
	});

	test("html.lang", async () => {
		expect(await check("html.lang", page(""))).toEqual([]);
		expect(await check("html.lang", "<html><head></head></html>")).toHaveLength(
			1,
		);
		expect(
			await check("html.lang", '<html lang=" "><head></head></html>'),
		).toHaveLength(1);
	});

	test("html.charset", async () => {
		expect(await check("html.charset", page('<meta charset="utf-8">'))).toEqual(
			[],
		);
		expect(await check("html.charset", page(""))).toEqual([
			'A <meta charset="utf-8"> tag must exist',
		]);
		let late = page(`<title>${"x".repeat(1100)}</title><meta charset="utf-8">`);
		expect(await check("html.charset", late)).toEqual([
			"Must be within the first 1024 bytes of the page",
		]);
	});

	test("html.favicon", async () => {
		expect(
			await check("html.favicon", page('<link rel="icon" href="/a.svg">')),
		).toEqual([]);
		expect(
			await check(
				"html.favicon",
				page('<link rel="shortcut icon" href="/a.ico">'),
			),
		).toEqual([]);
		expect(await check("html.favicon", page(""))).toHaveLength(1);
	});
});

describe("title", () => {
	test("title.content.null and title.content.undefined match whole words", async () => {
		let title = (text: string) => page(`<title>${text}</title>`);
		expect(
			await check("title.content.null", title("Products | null")),
		).toHaveLength(1);
		expect(
			await check("title.content.null", title("Nullify a contract")),
		).toEqual([]);
		expect(
			await check("title.content.null", title("An annulled contract")),
		).toEqual([]);
		expect(
			await check("title.content.undefined", title("undefined · Shop")),
		).toHaveLength(1);
		expect(
			await check("title.content.undefined", title("Undefinedness, explained")),
		).toEqual([]);
	});

	test("title.content.html allows tags that no HTML element has", async () => {
		let title = (text: string) => page(`<title>${text}</title>`);
		expect(
			await check(
				"title.content.html",
				title("The &lt;svelte:head&gt; element"),
			),
		).toEqual([]);
		expect(
			await check(
				"title.content.html",
				title("The &lt;em&gt;best&lt;/em&gt; bread"),
			),
		).toHaveLength(1);
	});

	test("title.content.length defaults to 10 to 60", async () => {
		expect(
			await check(
				"title.content.length",
				page(`<title>${"a".repeat(60)}</title>`),
			),
		).toEqual([]);
		expect(
			await check(
				"title.content.length",
				page(`<title>${"a".repeat(61)}</title>`),
			),
		).toEqual(["Must not have more than 60 characters"]);
	});
});

describe("description", () => {
	let meta = (content: string) =>
		`<meta name="description" content="${content}">`;

	test("description.content.null and description.content.undefined match whole words", async () => {
		expect(
			await check("description.content.null", page(meta("Prices from null"))),
		).toHaveLength(1);
		expect(
			await check(
				"description.content.null",
				page(meta("How to annul a contract, or nullify it")),
			),
		).toEqual([]);
		expect(
			await check(
				"description.content.undefined",
				page(meta("Shipping: undefined")),
			),
		).toHaveLength(1);
		expect(
			await check(
				"description.content.undefined",
				page(meta("The undefinedness of it all")),
			),
		).toEqual([]);
	});

	test("description.content.length defaults to 50 to 160", async () => {
		expect(
			await check("description.content.length", page(meta("a".repeat(50)))),
		).toEqual([]);
		expect(
			await check("description.content.length", page(meta("a".repeat(49)))),
		).toEqual(["Must not have less than 50 characters"]);
		expect(
			await check("description.content.length", page(meta("a".repeat(161)))),
		).toEqual(["Must not have more than 160 characters"]);
	});

	test("description.content.html checks the content", async () => {
		expect(
			await check("description.content.html", page(meta("Plain text"))),
		).toEqual([]);
		expect(
			await check(
				"description.content.html",
				page(meta("&lt;b&gt;bold&lt;/b&gt;")),
			),
		).toEqual(["Must not include HTML content"]);
	});

	test("description.content.html allows tags that no HTML element has", async () => {
		for (let content of [
			"How &lt;svelte:head&gt; works",
			"Define a &lt;my-element&gt; once",
			"A vector&lt;int&gt; holds numbers",
			"Prices for a &lt; b, and c &gt; d",
		]) {
			expect(
				await check("description.content.html", page(meta(content))),
			).toEqual([]);
		}
		for (let content of [
			"Our &lt;/p&gt; bread",
			"Our &lt;br/&gt; bread",
			"Our &lt;A HREF=&quot;/&quot;&gt;bread",
			"Our &lt;!-- best --&gt; bread",
		]) {
			expect(
				await check("description.content.html", page(meta(content))),
			).toHaveLength(1);
		}
	});

	test("description.content.title ignores stop words", async () => {
		let html = (title: string, content: string) =>
			page(`<title>${title}</title>${meta(content)}`);
		expect(
			await check(
				"description.content.title",
				html("The Best Bread", "Fresh bread daily"),
			),
		).toEqual([]);
		expect(
			await check(
				"description.content.title",
				html("The Bakery", "The shop in town."),
			),
		).toHaveLength(1);
	});

	test("description.content.title matches singular and plural words", async () => {
		let html = (title: string, content: string) =>
			page(`<title>${title}</title>${meta(content)}`);
		for (let [title, content] of [
			["View transitions", "How to animate a transition"],
			["Dynamic images", "Draw an image at build time"],
			["Our stories", "A story of bread"],
			["Movies", "A movie night"],
			["Classes", "Each class of bread"],
			["Boxes", "A box of bread"],
		]) {
			expect(
				await check("description.content.title", html(title, content)),
			).toEqual([]);
		}
		expect(
			await check("description.content.title", html("Bakery.", ".Shop")),
		).toHaveLength(1);
	});
});

describe("canonical", () => {
	test("canonical.head", async () => {
		let link = '<link rel="canonical" href="https://example.com/">';
		expect(await check("canonical.head", page(link))).toEqual([]);
		expect(await check("canonical.head", page("", link))).toEqual([
			"Must be inside <head>",
		]);
	});

	test("canonical.href.self", async () => {
		let link = '<link rel="canonical" href="https://example.com/a/">';
		expect(
			await check("canonical.href.self", page(link), { url: `${HOST}/a/` }),
		).toEqual([]);
		expect(
			await check("canonical.href.self", page(link), { url: `${HOST}/a/#top` }),
		).toEqual([]);
		expect(
			await check("canonical.href.self", page(link), { url: `${HOST}/b/` }),
		).toEqual([`Must point to this page, ${HOST}/b/`]);
		expect(await check("canonical.href.self", page(link))).toEqual([]);
	});
});

describe("canonical.href.match", () => {
	let link = (href: string) => page(`<link rel="canonical" href="${href}">`);

	test("compares the hostname of the canonical URL", async () => {
		expect(
			await check("canonical.href.match", link("https://EXAMPLE.com/a/")),
		).toEqual([]);
		expect(
			await check(
				"canonical.href.match",
				link("https://example.com.evil.net/"),
			),
		).toEqual(["Must point to the site hostname, example.com"]);
		expect(
			await check(
				"canonical.href.match",
				link("https://other.com/?example.com"),
			),
		).toHaveLength(1);
	});

	test("uses the hostname option over the host", async () => {
		let www = { setting: { hostname: "WWW.example.com" } };
		expect(
			await check(
				"canonical.href.match",
				link("https://www.example.com/"),
				www,
			),
		).toEqual([]);
		expect(
			await check("canonical.href.match", link("https://example.com/"), www),
		).toEqual(["Must point to the site hostname, www.example.com"]);
	});

	test("is skipped without a host or hostname", async () => {
		expect(
			await check("canonical.href.match", link("https://other.com/"), {
				host: "",
			}),
		).toEqual([]);
	});
});

describe("viewport", () => {
	let meta = (content: string) => `<meta name="viewport" content="${content}">`;

	test("viewport.content.zoom", async () => {
		expect(
			await check(
				"viewport.content.zoom",
				page(meta("width=device-width, initial-scale=1")),
			),
		).toEqual([]);
		expect(
			await check("viewport.content.zoom", page(meta("maximum-scale=5"))),
		).toEqual([]);
		expect(
			await check("viewport.content.zoom", page(meta("user-scalable=no"))),
		).toHaveLength(1);
		expect(
			await check("viewport.content.zoom", page(meta("user-scalable=0"))),
		).toHaveLength(1);
		expect(
			await check("viewport.content.zoom", page(meta("maximum-scale=1"))),
		).toHaveLength(1);
	});
});

describe("heading", () => {
	test("heading.exists and heading.single", async () => {
		expect(await check("heading.exists", page("", "<h1>a</h1>"))).toEqual([]);
		expect(await check("heading.exists", page(""))).toHaveLength(1);
		expect(
			await check("heading.single", page("", "<h1>a</h1><h1>b</h1>")),
		).toHaveLength(1);
	});

	test("heading.order", async () => {
		expect(
			await check(
				"heading.order",
				page("", "<h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2>"),
			),
		).toEqual([]);
		expect(
			await check("heading.order", page("", "<h1>a</h1><h3>b</h3>")),
		).toEqual(["Must not skip from <h1> to <h3>"]);
	});

	test("heading.order checks the first heading", async () => {
		expect(
			await check(
				"heading.order",
				page("", "<h2>Menu</h2><h1>a</h1><h2>b</h2>"),
			),
		).toEqual([]);
		expect(
			await check("heading.order", page("", "<h4>Docs</h4><h1>a</h1>")),
		).toEqual(["Must start at <h1> or <h2>, not <h4>"]);
		expect(
			await check("heading.order", page("", "<h3>a</h3><h5>b</h5>")),
		).toEqual([
			"Must start at <h1> or <h2>, not <h3>",
			"Must not skip from <h3> to <h5>",
		]);
	});
});

describe("robots", () => {
	let meta = (name: string, content: string) =>
		`<meta name="${name}" content="${content}">`;

	test("robots.noindex and robots.nofollow", async () => {
		expect(
			await check("robots.noindex", page(meta("robots", "index, follow"))),
		).toEqual([]);
		expect(
			await check("robots.noindex", page(meta("robots", "noindex"))),
		).toHaveLength(1);
		expect(
			await check("robots.noindex", page(meta("googlebot", "none"))),
		).toHaveLength(1);
		expect(
			await check("robots.nofollow", page(meta("ROBOTS", "NoFollow"))),
		).toHaveLength(1);
		expect(
			await check("robots.nofollow", page(meta("robots", "noindex"))),
		).toEqual([]);
	});
});

describe("image", () => {
	test("image.alt.content.null and image.alt.content.undefined match whole words", async () => {
		let img = (alt: string) => page("", `<img src="a.png" alt="${alt}">`);
		expect(await check("image.alt.content.null", img("null"))).toHaveLength(1);
		expect(
			await check("image.alt.content.null", img("An annulled ticket")),
		).toEqual([]);
		expect(
			await check("image.alt.content.undefined", img("undefined")),
		).toHaveLength(1);
		expect(
			await check("image.alt.content.undefined", img("Undefinedness")),
		).toEqual([]);
	});

	test("image.alt.exists allows decorative images", async () => {
		expect(
			await check("image.alt.exists", page("", '<img src="a.png" alt="">')),
		).toEqual([]);
		expect(
			await check("image.alt.exists", page("", '<img src="a.png">')),
		).toHaveLength(1);
	});

	test("image.alt.content.html allows tags that no HTML element has", async () => {
		expect(
			await check(
				"image.alt.content.html",
				page("", '<img src="a.png" alt="The &lt;my-cat&gt; element">'),
			),
		).toEqual([]);
	});

	test("image.alt.content.html", async () => {
		expect(
			await check(
				"image.alt.content.html",
				page("", '<img src="a.png" alt="A cat">'),
			),
		).toEqual([]);
		expect(
			await check(
				"image.alt.content.html",
				page("", '<img src="a.png" alt="&lt;b&gt;cat">'),
			),
		).toHaveLength(1);
	});
});

describe("link", () => {
	let link = (href: string, text = "Read the recipe") =>
		page("", `<a href="${href}">${text}</a>`);

	test("link.internal.trailing", async () => {
		for (let href of [
			"/",
			"/about/",
			"/menu.pdf",
			"/about/?q=1",
			"/about/#top",
			"https://example.com/a/",
		]) {
			expect(await check("link.internal.trailing", link(href))).toEqual([]);
		}
		for (let href of [
			"/about",
			"/about?q=1",
			"/a/b",
			"https://example.com/a",
		]) {
			expect(await check("link.internal.trailing", link(href))).toHaveLength(1);
		}
	});

	test("link.internal checks relative links without a host", async () => {
		let none = { host: "" };
		expect(
			await check("link.internal.lowercase", link("/About/"), none),
		).toHaveLength(1);
		expect(
			await check("link.internal.lowercase", link(`${HOST}/About/`), none),
		).toEqual([]);
		expect(
			await check("link.internal.lowercase", link("file:///About/"), none),
		).toEqual([]);
	});

	test("link.external.limit counts absolute links only without a host", async () => {
		let none = { host: "", setting: { max: 1 } };
		let links = (...hrefs: string[]) =>
			page("", hrefs.map((x) => `<a href="${x}">Recipe</a>`).join(""));
		expect(
			await check("link.external.limit", links("/a/", "/b/", "c/"), none),
		).toEqual([]);
		expect(
			await check(
				"link.external.limit",
				links("https://a.com/", "https://b.com/"),
				none,
			),
		).toHaveLength(1);
	});

	test("link.internal resolves relative links against the page URL", async () => {
		let relative = link("Other/");
		expect(
			await check("link.internal.lowercase", relative, { url: `${HOST}/a/` }),
		).toHaveLength(1);
		expect(
			await check("link.internal.lowercase", link("https://other.com/Other/"), {
				url: `${HOST}/a/`,
			}),
		).toEqual([]);
	});

	test("link.blank.noreferrer checks external links only", async () => {
		let blank = (href: string) =>
			page("", `<a href="${href}" target="_blank" rel="noopener">Recipe</a>`);
		for (let href of ["/recipe.md", "recipe/", `${HOST}/recipe/`]) {
			expect(await check("link.blank.noreferrer", blank(href))).toEqual([]);
		}
		for (let href of ["https://other.com/", "https://x.com/recipe"]) {
			expect(await check("link.blank.noreferrer", blank(href))).toHaveLength(1);
		}
		let none = { host: "" };
		expect(
			await check("link.blank.noreferrer", blank("/recipe.md"), none),
		).toEqual([]);
		expect(
			await check("link.blank.noreferrer", blank(`${HOST}/recipe/`), none),
		).toHaveLength(1);
	});

	test("link.text.exists", async () => {
		expect(await check("link.text.exists", link("/a/"))).toEqual([]);
		expect(
			await check(
				"link.text.exists",
				page("", '<a href="/a/" aria-label="Home"></a>'),
			),
		).toEqual([]);
		expect(
			await check(
				"link.text.exists",
				page("", '<a href="/a/"><img src="a.png" alt="Home"></a>'),
			),
		).toEqual([]);
		expect(
			await check(
				"link.text.exists",
				page("", '<a href="/a/"><img src="a.png" alt=""></a>'),
			),
		).toHaveLength(1);
		expect(await check("link.text.exists", link("/a/", " "))).toHaveLength(1);
	});

	test("link.text.vague", async () => {
		expect(
			await check("link.text.vague", link("/a/", "Our sourdough recipe")),
		).toEqual([]);
		expect(await check("link.text.vague", link("/a/", "Click here!"))).toEqual([
			'Must describe the target, not "Click here!"',
		]);
		let words = { words: ["go"] };
		expect(
			await check("link.text.vague", link("/a/", "Go"), { setting: words }),
		).toHaveLength(1);
		expect(
			await check("link.text.vague", link("/a/", "Read more"), {
				setting: words,
			}),
		).toEqual([]);
	});

	test("links to a section of the same page", async () => {
		let section = link("#configure-a-rule", "link");
		for (let rule of [
			"link.href.empty",
			"link.internal.absolute",
			"link.internal.https",
			"link.internal.trailing",
			"link.text.vague",
		]) {
			expect(await check(rule, section)).toEqual([]);
		}
		expect(await check("link.text.vague", link("/a/#b", "link"))).toHaveLength(
			1,
		);
		expect(await check("link.text.exists", link("#top", " "))).toHaveLength(1);
	});
});

describe("mixed", () => {
	test("mixed.content", async () => {
		let body =
			'<img src="http://example.com/a.png" alt="a"><script src="https://example.com/a.js"></script>';
		expect(await check("mixed.content", page("", body))).toEqual([
			'Must load "src" over https://, not http://',
		]);
		expect(
			await check(
				"mixed.content",
				page("", '<img srcset="/a.png 1x, http://x.com/b.png 2x" alt="a">'),
			),
		).toHaveLength(1);
		expect(
			await check("mixed.content", page("", body), {
				host: "http://example.com",
			}),
		).toEqual([]);
	});
});

describe("hreflang", () => {
	let alt = (code: string, href = "https://example.com/") =>
		`<link rel="alternate" hreflang="${code}" href="${href}">`;

	test("hreflang.code and hreflang.absolute", async () => {
		expect(
			await check(
				"hreflang.code",
				page(alt("en") + alt("pt-BR") + alt("zh-Hant") + alt("x-default")),
			),
		).toEqual([]);
		expect(await check("hreflang.code", page(alt("english")))).toEqual([
			'Must be a valid language code, not "english"',
		]);
		expect(
			await check("hreflang.absolute", page(alt("en", "/en/"))),
		).toHaveLength(1);
	});

	test("hreflang.default", async () => {
		expect(
			await check("hreflang.default", page(alt("en") + alt("x-default"))),
		).toEqual([]);
		expect(await check("hreflang.default", page(alt("en")))).toHaveLength(1);
		expect(await check("hreflang.default", page(""))).toEqual([]);
	});
});

describe("og and twitter", () => {
	let meta = (property: string, content: string) =>
		`<meta property="${property}" content="${content}">`;

	test("og.image.secure", async () => {
		expect(
			await check(
				"og.image.secure",
				page(meta("og:image", "https://example.com/a.png")),
			),
		).toEqual([]);
		expect(
			await check("og.image.secure", page(meta("og:image", "/a.png"))),
		).toHaveLength(1);
	});

	test("og.url matches the canonical URL, or the page URL", async () => {
		let canonical = '<link rel="canonical" href="https://example.com/a/">';
		expect(
			await check(
				"og.url",
				page(canonical + meta("og:url", "https://example.com/a/")),
			),
		).toEqual([]);
		expect(
			await check(
				"og.url",
				page(canonical + meta("og:url", "https://example.com/b/")),
			),
		).toHaveLength(1);
		expect(
			await check("og.url", page(meta("og:url", "https://example.com/b/")), {
				url: `${HOST}/a/`,
			}),
		).toHaveLength(1);
		expect(await check("og.url", page(""))).toEqual([
			'A "og:url" meta tag must exist',
		]);
	});

	test("twitter.card", async () => {
		let card = (value: string) =>
			`<meta name="twitter:card" content="${value}">`;
		expect(await check("twitter.card", page(card("summary")))).toEqual([]);
		expect(await check("twitter.card", page(card("big")))).toEqual([
			"Must be one of: summary, summary_large_image, app, player",
		]);
		expect(await check("twitter.card", page(""))).toEqual([
			'A "twitter:card" meta tag must exist',
		]);
	});
});
