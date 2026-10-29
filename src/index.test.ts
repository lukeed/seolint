import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import {
	mkdir,
	mkdtemp,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import * as conf from "./config";
import * as seolint from "./index";

import type { Message, Report, Setting } from "./types";

const fixtures = resolve(import.meta.dir, "fixtures");
const site = join(fixtures, "site");

const GOOD = await Bun.file(join(site, "index.html")).text();
const BAD = await Bun.file(join(site, "sub/bad.html")).text();

type Keyed = Record<string, Omit<Message, "rule" | "severity" | "docs">[]>;

/**
 * Group messages by rule, which keeps expectations readable and ignores
 * the order of messages across rules.
 */
function keyed(list: Message[] | undefined): Keyed | undefined {
	if (!list) return list;
	let output: Keyed = {};
	for (let { rule, severity, docs, ...rest } of list) {
		(output[rule] ||= []).push(rest);
	}
	return output;
}

function reported(report: Report): Record<string, Keyed | undefined> {
	return Object.fromEntries(
		Object.entries(report).map(([input, list]) => [input, keyed(list)]),
	);
}

const ALT = 'Must have an `alt` attribute; use alt="" for decorative images';

const BAD_REPORT = {
	"html.lang": [
		{
			message: "The <html> element must have a `lang` attribute",
			line: 2,
			col: 1,
		},
	],
	"html.charset": [{ message: 'A <meta charset="utf-8"> tag must exist' }],
	"html.favicon": [{ message: 'A <link rel="icon"> tag must exist' }],
	"title.content.null": [
		{ message: 'Must not include "null" in `title` value', line: 4, col: 3 },
	],
	"title.content.length": [
		{ message: "Must not have less than 10 characters", line: 4, col: 3 },
	],
	"description.exists": [{ message: 'A "meta[name=description]" must exist' }],
	"canonical.href.lowercase": [
		{ message: "Must not include uppercase character(s)", line: 5, col: 3 },
	],
	"canonical.href.https": [
		{ message: 'Must point to an "https://" address', line: 5, col: 3 },
	],
	"canonical.href.match": [
		{ message: "Must include the provided `hostname` value", line: 5, col: 3 },
	],
	"viewport.exists": [{ message: 'A "meta[name=viewport]" tag must exist' }],
	"heading.exists": [{ message: "A page must have an <h1>" }],
	"image.alt.exists": [
		{
			message: 'Must have an `alt` attribute; use alt="" for decorative images',
			line: 8,
			col: 46,
		},
	],
	"link.blank.noopener": [
		{
			message: 'Must include "rel=noopener" when "target=_blank" in use',
			line: 8,
			col: 3,
		},
	],
	"link.blank.noreferrer": [
		{
			message: 'Must include "rel=noreferrer" when "target=_blank" in use',
			line: 8,
			col: 3,
		},
	],
	"og.title": [{ message: 'A "og:title" meta tag must exist' }],
	"og.description": [{ message: 'A "og:description" meta tag must exist' }],
	"og.image": [{ message: 'A "og:image" meta tag must exist' }],
	"og.url": [{ message: 'A "og:url" meta tag must exist' }],
	"twitter.card": [
		{
			message: 'A "twitter:card" meta tag must exist',
		},
	],
};

/** With a host, the link of the bad page is internal, so it needs no `noreferrer`. */
const { "link.blank.noreferrer": _, ...BAD_INTERNAL_REPORT } = BAD_REPORT;

const BAD_HOST_REPORT = {
	...BAD_INTERNAL_REPORT,
	"link.internal.lowercase": [
		{ message: "Internal links should not include uppercase", line: 8, col: 3 },
	],
	"link.internal.pretty": [
		{
			message: 'Internal links should not include ".html" suffix',
			line: 8,
			col: 3,
		},
	],
};

/** The bad page when the whole fixture site is linted with a host. */
const BAD_SITE_REPORT = {
	...BAD_HOST_REPORT,
	"canonical.href.self": [
		{
			message: "Must point to this page, https://example.com/sub/bad.html",
			line: 5,
			col: 3,
		},
	],
	"site.link.exists": [
		{
			message: "Must point to a file that exists, not /About.html",
			line: 8,
			col: 3,
		},
	],
};

describe("lint()", () => {
	test("should return `undefined` when valid", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		expect(keyed(await seolint.lint(GOOD, config))).toBeUndefined();
	});

	test("should report every failed rule with its location", async () => {
		let config = await conf.resolve();
		expect(keyed(await seolint.lint(BAD, config))).toEqual(BAD_REPORT);
	});

	test("should report each failure of the same rule", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace(
			'<img src="x.png" alt="a photo" />',
			'<img src="a.png" />\n<img src="b.png" />',
		);

		let output = keyed(await seolint.lint(html, config));
		expect(output).toEqual({
			"image.alt.exists": [
				{ message: ALT, line: 24, col: 23 },
				{ message: ALT, line: 25, col: 1 },
			],
		});
	});

	test("should skip disabled rules", async () => {
		let config = await conf.resolve();
		config.rules = { "image.alt.exists": false, "title.content.null": false };

		let output = keyed(await seolint.lint(BAD, config));
		expect(output).not.toHaveProperty("image.alt.exists");
		expect(output).not.toHaveProperty("title.content.null");
	});

	test("should pass rule options to checks", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		config.rules = { "title.content.length": { max: 5 } };

		expect(keyed(await seolint.lint(GOOD, config))).toEqual({
			"title.content.length": [
				{ message: "Must not have more than 5 characters", line: 5, col: 3 },
			],
		});
	});

	test("should not crash when `exists` rules are disabled", async () => {
		let config = await conf.resolve();
		config.rules = {
			"*": false,
			"title.content.length": true,
			"canonical.href.https": true,
			"description.content.empty": true,
			"viewport.content.empty": true,
		};

		let output = keyed(
			await seolint.lint("<html><head></head></html>", config),
		);
		expect(output).toBeUndefined();
	});

	test("should treat absolute `host` links as internal", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace('href="/"', 'href="https://example.com/About/"');

		expect(keyed(await seolint.lint(html, config))).toEqual({
			"link.internal.lowercase": [
				{
					message: "Internal links should not include uppercase",
					line: 24,
					col: 3,
				},
			],
		});
	});

	test("should require `rel` on external `target=_blank` links", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace(
			'<a href="/">home</a>',
			'<a href="https://other.com/" target="_blank">other</a>',
		);

		expect(keyed(await seolint.lint(html, config))).toEqual({
			"link.blank.noopener": [
				{
					message: 'Must include "rel=noopener" when "target=_blank" in use',
					line: 24,
					col: 3,
				},
			],
			"link.blank.noreferrer": [
				{
					message: 'Must include "rel=noreferrer" when "target=_blank" in use',
					line: 24,
					col: 3,
				},
			],
		});
	});

	test("should treat unparsable links as external", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace('href="/"', 'href="http://["');
		expect(keyed(await seolint.lint(html, config))).toBeUndefined();
	});

	test("should allow entities in the title", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace(
			"Hello world, this is a good page",
			"Hello world &amp; this is a good page",
		);
		expect(keyed(await seolint.lint(html, config))).toBeUndefined();
	});

	test("should report HTML in the title", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		let html = GOOD.replace(
			"Hello world, this is a good page",
			"Hello <b>world</b>, this is a good page",
		);
		expect(keyed(await seolint.lint(html, config))).toEqual({
			"title.content.html": [
				{ message: "Must not include HTML content", line: 5, col: 3 },
			],
		});
	});

	test("should run custom plugins", async () => {
		let output = keyed(
			await seolint.lint(GOOD, {
				host: "https://example.com",
				plugins: [
					conf.plugin({
						name: "custom",
						rules: { "custom.rule": true },
						run(context) {
							context.assert("custom.rule", false, "custom failure");
						},
					}),
				],
			}),
		);

		expect(output).toEqual({ "custom.rule": [{ message: "custom failure" }] });
	});

	test("should reject when a plugin throws", async () => {
		let boom = conf.plugin({
			name: "boom",
			rules: {},
			run() {
				throw new TypeError("nope");
			},
		});

		let error = await seolint
			.lint(GOOD, { plugins: [boom] })
			.catch((err: unknown) => err);

		expect(error).toBeInstanceOf(Error);
		expect(error).toHaveProperty("message", 'Plugin "boom" failed');
		expect(error).toHaveProperty("cause", new TypeError("nope"));
	});

	test("should not write to the console", async () => {
		let warn = spyOn(console, "warn");
		let error = spyOn(console, "error");

		keyed(await seolint.lint(BAD, await conf.resolve()));

		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		warn.mockRestore();
		error.mockRestore();
	});
});

describe("rules", () => {
	let reporter = conf.plugin({
		name: "reporter",
		rules: { "reporter.rule": true },
		run(context) {
			context.report("reporter.rule", "reported");
		},
	});

	test("should run the built-in plugins without a config", async () => {
		expect(keyed(await seolint.lint(BAD))).toEqual(BAD_REPORT);
	});

	test("should skip report() for a disabled rule", async () => {
		let config = { host: "https://example.com", plugins: [reporter] };
		expect(keyed(await seolint.lint(GOOD, config))).toEqual({
			"reporter.rule": [{ message: "reported" }],
		});

		let off = { ...config, rules: { "reporter.rule": false } };
		expect(await seolint.lint(GOOD, off)).toBeUndefined();
	});

	test("should reject a rule that the plugin did not declare", async () => {
		let sneaky = conf.plugin({
			name: "sneaky",
			rules: {},
			run(context) {
				// @ts-expect-error report a rule that the plugin did not declare
				context.report("other.rule", "nope");
			},
		});

		let error = await seolint
			.lint(GOOD, { plugins: [sneaky] })
			.catch((err: unknown) => err);

		expect(error).toHaveProperty("message", 'Plugin "sneaky" failed');
		expect(error).toHaveProperty(
			"cause",
			new Error('Rule "other.rule" is not declared by any plugin'),
		);
	});

	test("should reject unknown rule names and patterns", async () => {
		let config = { rules: { "title.exist": false, "nope.*": false } };
		await expect(seolint.lint(GOOD, config)).rejects.toThrow(
			'Unknown rules in config: "nope.*", "title.exist"',
		);
	});

	test("should apply patterns before exact names", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		config.rules = { "link.*": false, "link.blank.noopener": true };

		let output = keyed(await seolint.lint(BAD, config)) ?? {};
		let links = Object.keys(output).filter((x) => x.startsWith("link."));
		expect(links).toEqual(["link.blank.noopener"]);
	});

	test("should replace a built-in plugin with the same name", async () => {
		let title = conf.plugin({ name: "title", rules: {}, run() {} });
		let output = keyed(await seolint.lint(BAD, { plugins: [title] })) ?? {};
		expect(Object.keys(output).some((x) => x.startsWith("title."))).toBe(false);

		let config = { plugins: [title], rules: { "title.exists": false } };
		await expect(seolint.lint(BAD, config)).rejects.toThrow(
			'Unknown rule in config: "title.exists"',
		);
	});

	test("should merge rule options over the defaults", async () => {
		let config = { host: "https://example.com" };

		let on = { ...config, rules: { "title.content.length": true } };
		expect(await seolint.lint(GOOD, on)).toBeUndefined();

		let partial = { ...config, rules: { "title.content.length": { min: 50 } } };
		expect(keyed(await seolint.lint(GOOD, partial))).toEqual({
			"title.content.length": [
				{ message: "Must not have less than 50 characters", line: 5, col: 3 },
			],
		});
	});

	test("should validate rules in resolve()", async () => {
		let dir = await mkdtemp(join(tmpdir(), "seolint-"));
		await writeFile(
			join(dir, "seolint.config.mjs"),
			'export default { rules: { "title.exist": false } }',
		);
		await expect(conf.resolve({ cwd: dir })).rejects.toThrow(
			'Unknown rule in config: "title.exist"',
		);
		await rm(dir, { recursive: true, force: true });
	});

	test("should apply severities", async () => {
		let config = (rules: Record<string, Setting>) => ({
			host: "https://example.com",
			rules: { "*": false, ...rules },
		});
		let severity = async (setting: Setting) => {
			let output = await seolint.lint(BAD, config({ "html.lang": setting }));
			return output?.map((x) => x.severity);
		};

		expect(await severity(true)).toEqual(["error"]);
		expect(await severity("warn")).toEqual(["warn"]);
		expect(await severity(["warn", {}])).toEqual(["warn"]);

		let output = await seolint.lint(BAD, config({ "html.favicon": true }));
		expect(output?.map((x) => x.severity)).toEqual(["warn"]);

		let lengths = await seolint.lint(
			BAD,
			config({ "title.content.length": ["warn", { min: 5 }] }),
		);
		expect(lengths?.map((x) => [x.severity, x.message])).toEqual([
			["warn", "Must not have less than 5 characters"],
		]);
	});

	test("should link messages to their docs", async () => {
		let output = await seolint.lint(BAD, {
			rules: { "*": false, "html.lang": true },
		});
		expect(output?.[0].docs).toBe("https://seolint.io/docs/rules/html.lang/");
	});

	test("should reject invalid settings", async () => {
		await expect(
			// @ts-expect-error not a setting
			seolint.lint(GOOD, { rules: { "html.lang": "loud" } }),
		).rejects.toThrow('Invalid setting for rule "html.lang"');
	});

	test("should reject a rule that two plugins declare", async () => {
		let copy = conf.plugin({
			name: "copy",
			rules: { "html.lang": true },
			run() {},
		});
		await expect(seolint.lint(GOOD, { plugins: [copy] })).rejects.toThrow(
			'Rule "html.lang" is declared by plugins "html" and "copy"',
		);
	});

	test("should turn on a rule that is off by default", async () => {
		let optin = conf.plugin({
			name: "optin",
			rules: { "optin.rule": false },
			run(context) {
				context.report("optin.rule", "reported");
			},
		});
		let config = { host: "https://example.com", plugins: [optin] };
		expect(await seolint.lint(GOOD, config)).toBeUndefined();

		let on = { ...config, rules: { "optin.rule": true } };
		expect(keyed(await seolint.lint(GOOD, on))).toEqual({
			"optin.rule": [{ message: "reported" }],
		});
	});

	test("should pass the page URL to plugins", async () => {
		let seen: (string | undefined)[] = [];
		let spy = conf.plugin({
			name: "spy",
			rules: {},
			run(context) {
				seen.push(context.url);
			},
		});
		await seolint.lint(GOOD, { plugins: [spy] }, "https://example.com/a/");
		await seolint.fs(site, { host: "https://example.com", plugins: [spy] });
		expect(seen.sort()).toEqual([
			"https://example.com/",
			"https://example.com/a/",
			"https://example.com/sub/bad.html",
		]);
	});

	test("should run finish() with what run() returned", async () => {
		let counter = conf.plugin({
			name: "counter",
			rules: { "counter.pages": { max: 1 } },
			run(context) {
				return context.url ?? "unknown";
			},
			finish(site, pages) {
				let options = site.load("counter.pages");
				if (options && pages.length > options.max) {
					site.report(
						"counter.pages",
						`Found ${pages.map((x) => x.data).join(", ")}`,
						"summary",
					);
				}
			},
		});
		let config = {
			host: "https://example.com",
			plugins: [counter],
			rules: { "*": false, "counter.pages": true },
		};
		expect(reported(await seolint.fs(site, config))).toEqual({
			summary: {
				"counter.pages": [
					{
						message:
							"Found https://example.com/, https://example.com/sub/bad.html",
					},
				],
			},
		});
	});
});

describe("ignore", () => {
	let config = (ignore: string[]) => ({ host: "https://example.com", ignore });

	test("should skip pages that match a pattern", async () => {
		expect(reported(await seolint.fs(site, config(["sub/**"])))).toEqual({});
		expect(reported(await seolint.fs(site, config(["bad.html"])))).toEqual({});
		expect(Object.keys(await seolint.fs(site, config(["other/**"])))).toEqual([
			join(site, "sub/bad.html"),
		]);
	});

	test("should leave ignored pages out of site checks", async () => {
		let rules = { "*": false, "site.sitemap": true };
		let output = await seolint.fs(site, {
			...config(["sub/**"]),
			rules,
		});
		expect(output).toEqual({});
	});

	test("should match the URL path for URLs", async () => {
		let server = Bun.serve({
			port: 0,
			fetch: () =>
				new Response(BAD, { headers: { "content-type": "text/html" } }),
		});
		let href = new URL("/drafts/a/", server.url).href;
		expect(await seolint.url(href, config(["drafts/**"]))).toEqual({});
		expect(Object.keys(await seolint.url(href, config([])))).toEqual([href]);
		server.stop(true);
	});
});

describe("site", () => {
	let tmp: string;
	let config = (rules: Record<string, Setting> = {}) => ({
		host: "https://example.com",
		rules: { "*": false, ...rules },
	});
	let html = (title: string, description: string, body = "") =>
		`<html><head><title>${title}</title><meta name="description" content="${description}"></head><body>${body}</body></html>`;

	beforeAll(async () => {
		tmp = await realpath(await mkdtemp(join(tmpdir(), "seolint-site-")));
		await mkdir(join(tmp, "blog"), { recursive: true });
		await mkdir(join(tmp, "img"), { recursive: true });
		await mkdir(join(tmp, "my page"), { recursive: true });
		await writeFile(
			join(tmp, "index.html"),
			html(
				"Home",
				"Same",
				'<a href="/blog/">Blog</a><a href="/missing/">Gone</a>' +
					'<a href="/img/">Folder</a><a href="/img">Folder</a>' +
					'<a href="/my%20page/">Space</a><a href="/blog/../about">Up</a>',
			),
		);
		await writeFile(join(tmp, "my page/index.html"), html("Space", "Space"));
		await writeFile(
			join(tmp, "blog/index.html"),
			html(
				"Home",
				"Same",
				'<a href="/img/a.png">Image</a><a href="https://other.com/x/">Other</a>',
			),
		);
		await writeFile(
			join(tmp, "about.html"),
			html(
				"About",
				"Unique",
				'<a href="/about">About</a><a href="/blog/#top">Blog</a>',
			),
		);
		await writeFile(join(tmp, "img/a.png"), "");
	});

	afterAll(async () => {
		await rm(tmp, { recursive: true, force: true });
	});

	test("site.title.unique and site.description.unique", async () => {
		let output = reported(
			await seolint.fs(
				tmp,
				config({ "site.title.unique": true, "site.description.unique": true }),
			),
		);
		expect(Object.keys(output).sort()).toEqual([
			join(tmp, "blog/index.html"),
			join(tmp, "index.html"),
		]);
		expect(output[join(tmp, "index.html")]).toEqual({
			"site.title.unique": [
				{
					message: "Must be unique; 1 other page uses the same title",
					line: 1,
					col: 13,
				},
			],
			"site.description.unique": [
				{
					message: "Must be unique; 1 other page uses the same description",
					line: 1,
					col: 32,
				},
			],
		});
	});

	test("site.link.exists", async () => {
		let output = reported(
			await seolint.fs(tmp, config({ "site.link.exists": true })),
		);
		expect(output).toEqual({
			[join(tmp, "index.html")]: {
				"site.link.exists": [
					{
						message: "Must point to a file that exists, not /missing/",
						line: 1,
						col: 110,
					},
					{
						message: "Must point to a file that exists, not /img/",
						line: 1,
						col: 138,
					},
					{
						message: "Must point to a file that exists, not /img",
						line: 1,
						col: 164,
					},
				],
			},
		});
	});

	test("site.link.exists with a malformed escape", async () => {
		let dir = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
		await writeFile(join(dir, "index.html"), '<a href="/bad%zz/">x</a>');
		let output = reported(
			await seolint.fs(dir, config({ "site.link.exists": true })),
		);
		expect(output[join(dir, "index.html")]).toEqual({
			"site.link.exists": [
				{
					message: "Must point to a file that exists, not /bad%zz/",
					line: 1,
					col: 1,
				},
			],
		});
		await rm(dir, { recursive: true, force: true });
	});

	test("site.robots", async () => {
		let robots = join(tmp, "robots.txt");
		let rules = config({ "site.robots": true });

		expect(reported(await seolint.fs(tmp, rules))).toEqual({
			[robots]: {
				"site.robots": [{ message: "A robots.txt file must exist" }],
			},
		});

		await writeFile(
			robots,
			"User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nAllow: /\n",
		);
		expect(reported(await seolint.fs(tmp, rules))).toEqual({});

		await writeFile(robots, "User-agent: *\nDisallow: / # everything\n");
		expect(reported(await seolint.fs(tmp, rules))).toEqual({
			[robots]: {
				"site.robots": [
					{ message: 'Must not block every crawler with "Disallow: /"' },
				],
			},
		});
		await rm(robots);
	});

	test("site.sitemap", async () => {
		let sitemap = join(tmp, "sitemap.xml");
		let rules = config({ "site.sitemap": true });

		expect(reported(await seolint.fs(tmp, rules))).toEqual({
			[sitemap]: {
				"site.sitemap": [{ message: "A sitemap.xml file must exist" }],
			},
		});

		await writeFile(
			sitemap,
			"<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/blog/</loc></url><url><loc>https://example.com/my%20page/</loc></url></urlset>",
		);
		expect(reported(await seolint.fs(tmp, rules))).toEqual({
			[join(tmp, "about.html")]: {
				"site.sitemap": [
					{
						message:
							"Must be listed in sitemap.xml, as https://example.com/about.html",
					},
				],
			},
		});
		await rm(sitemap);
	});

	test("should skip site files for single files and URLs", async () => {
		let rules = config({ "site.robots": true, "site.sitemap": true });
		expect(reported(await seolint.fs(join(tmp, "index.html"), rules))).toEqual(
			{},
		);
	});
});

describe("fs()", () => {
	let tmp: string;

	beforeAll(async () => {
		tmp = await mkdtemp(join(tmpdir(), "seolint-"));
		await mkdir(join(tmp, "a/b"), { recursive: true });
		await writeFile(join(tmp, "a/b/deep.html"), BAD);
		await writeFile(join(tmp, "a/notes.txt"), BAD);
		for (let file of ["404.html", "a/500.html", "a/b/503.htm"]) {
			await writeFile(join(tmp, file), BAD);
		}
		for (let file of ["a/600.html", "a/4040.html"]) {
			await writeFile(join(tmp, file), BAD);
		}
		await symlink(join(site, "sub/bad.html"), join(tmp, "linked.html"));
		await symlink(site, join(tmp, "linked-dir"));
		for (let i = 0; i < 100; i++) {
			await writeFile(join(tmp, `page-${String(i).padStart(3, "0")}.htm`), BAD);
		}
	});

	afterAll(async () => {
		await rm(tmp, { recursive: true, force: true });
	});

	test("should lint a file", async () => {
		let config = await conf.resolve();
		let file = join(site, "sub/bad.html");
		expect(reported(await seolint.fs(file, config))).toEqual({
			[file]: BAD_REPORT,
		});
	});

	test("should ignore non-HTML files", async () => {
		let config = await conf.resolve();
		expect(
			reported(await seolint.fs(join(fixtures, "seolint.config.js"), config)),
		).toEqual({});
	});

	test("should walk a directory", async () => {
		let config = await conf.resolve({ host: "https://example.com" });
		expect(reported(await seolint.fs(site, config))).toEqual({
			[join(site, "sub/bad.html")]: BAD_SITE_REPORT,
		});
	});

	test("should walk nested and symlinked files, in sorted order", async () => {
		let config = await conf.resolve();
		config.rules = { "site.*": false };
		let output = reported(await seolint.fs(tmp, config));
		let keys = Object.keys(output);

		expect(keys).toHaveLength(104);
		expect(keys).toEqual([...keys].sort());
		expect(keys).toContain(join(tmp, "a/b/deep.html"));
		expect(keys).toContain(join(tmp, "linked.html"));
		expect(keys).not.toContain(join(tmp, "a/notes.txt"));
		expect(keys.some((x) => x.includes("linked-dir"))).toBe(false);
	});

	test("should skip error pages in a directory", async () => {
		let config = await conf.resolve();
		config.rules = { "site.*": false };
		let keys = Object.keys(await seolint.fs(tmp, config));
		expect(keys).not.toContain(join(tmp, "404.html"));
		expect(keys).not.toContain(join(tmp, "a/500.html"));
		expect(keys).not.toContain(join(tmp, "a/b/503.htm"));
		expect(keys).toContain(join(tmp, "a/600.html"));
		expect(keys).toContain(join(tmp, "a/4040.html"));
	});

	test("should lint an error page given as a file", async () => {
		let config = await conf.resolve();
		let file = join(tmp, "404.html");
		expect(Object.keys(await seolint.fs(file, config))).toEqual([file]);
		let output = await seolint.run({ ...config, inputs: [file] });
		expect(Object.keys(output)).toEqual([file]);
	});

	test("should reject a missing path", async () => {
		await expect(seolint.fs(join(tmp, "missing"))).rejects.toThrow("ENOENT");
	});
});

describe("url()", () => {
	let server: ReturnType<typeof Bun.serve>;

	beforeAll(() => {
		server = Bun.serve({
			port: 0,
			fetch(req) {
				let { pathname } = new URL(req.url);
				if (pathname === "/good/") {
					return new Response(GOOD, {
						headers: { "content-type": "text/html" },
					});
				}
				if (pathname === "/json") return Response.json({});
				return new Response("", { status: 404 });
			},
		});
	});

	afterAll(() => {
		server.stop(true);
	});

	test("should lint a URL with its origin as `host`", async () => {
		let config = await conf.resolve();
		config.rules = {
			"canonical.href.match": false,
			"canonical.href.self": false,
		};
		expect(
			reported(await seolint.url(new URL("/good/", server.url).href, config)),
		).toEqual({});
	});

	test("should reject non-HTML responses", async () => {
		let href = new URL("/json", server.url).href;
		let error = await seolint.url(href).catch((err: unknown) => err);

		expect(error).toHaveProperty("message", `Failed to lint "${href}"`);
		expect(error).toHaveProperty(
			"cause",
			new Error('Invalid "Content-Type" header'),
		);
	});

	test("should reject failed responses", async () => {
		let href = new URL("/missing", server.url).href;
		let error = await seolint.url(href).catch((err: unknown) => err);

		expect(error).toHaveProperty(
			"cause",
			new Error("Request failed with status 404"),
		);
	});
});

describe("run()", () => {
	test("should require inputs", async () => {
		await expect(seolint.run({})).rejects.toThrow("Missing inputs to analyze");
	});

	test("should reject mixed inputs", async () => {
		await expect(
			seolint.run({ inputs: ["site", "https://x.com"] }),
		).rejects.toThrow("Inputs cannot contain both file-system and URL targets");
	});

	test("should resolve inputs from `cwd`", async () => {
		let config = await conf.resolve({
			host: "https://example.com",
			inputs: ["site"],
		});
		expect(reported(await seolint.run(config, { cwd: fixtures }))).toEqual({
			[join(site, "sub/bad.html")]: BAD_SITE_REPORT,
		});
	});

	test("should accept absolute inputs", async () => {
		let config = await conf.resolve({
			host: "https://example.com",
			inputs: [site],
		});
		expect(reported(await seolint.run(config, { cwd: tmpdir() }))).toEqual({
			[join(site, "sub/bad.html")]: BAD_SITE_REPORT,
		});
	});

	test("should lint overlapping inputs once", async () => {
		let config = await conf.resolve({
			host: "https://example.com",
			inputs: ["site", "site/sub/bad.html"],
		});
		let output = reported(await seolint.run(config, { cwd: fixtures }));
		expect(Object.keys(output)).toEqual([join(site, "sub/bad.html")]);
	});

	test("should reject when an input fails", async () => {
		let config = await conf.resolve({ inputs: ["site", "missing"] });
		await expect(seolint.run(config, { cwd: fixtures })).rejects.toThrow(
			"ENOENT",
		);
	});
});
