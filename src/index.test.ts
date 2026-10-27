import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import * as seolint from "./index";

import type { Plugin } from "./types";

const fixtures = resolve(import.meta.dir, "fixtures");
const site = join(fixtures, "site");

const GOOD = await Bun.file(join(site, "good.html")).text();
const BAD = await Bun.file(join(site, "sub/bad.html")).text();

const BAD_REPORT = {
	"title.content.null": [
		{ message: 'Must not include "null" in `title` value', line: 4, col: 3 },
	],
	"title.content.length": [
		{ message: "Must not have less than 10 characters", line: 4, col: 3 },
	],
	"canonical.href.lowercase": [
		{ message: "Must not include uppercase character(s)", line: 5, col: 3 },
	],
	"canonical.href.https": [
		{ message: 'Must point to an "https://" address', line: 5, col: 3 },
	],
	"canonical.href.match": [
		{ message: "Must include the provided `hostname` value", line: 5, col: 3 },
	],
	"description.exists": [{ message: 'A "meta[name=description]" must exist' }],
	"viewport.exists": [{ message: 'A "meta[name=viewport]" tag must exist' }],
	"image.alt.exists": [
		{ message: "Must have an `alt` attribute", line: 8, col: 46 },
	],
};

const BAD_HOST_REPORT = {
	...BAD_REPORT,
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
};

describe("config()", () => {
	test("should resolve with `Config` defaults", async () => {
		let output = await seolint.config();

		expect(output.host).toBe("");
		expect(output.inputs).toEqual([]);
		expect(output.plugins).toHaveLength(6);
		expect(output.rules).toEqual({});
	});

	test("should accept `input` option", async () => {
		let output = await seolint.config({ input: ["foo", "bar"] });
		expect(output.inputs).toEqual(["foo", "bar"]);
	});

	test("should accept `host` option :: valid", async () => {
		let output = await seolint.config({ host: "https://foobar.com" });
		expect(output.host).toBe("https://foobar.com");
	});

	test("should accept `host` option :: invalid", async () => {
		await expect(seolint.config({ host: "foobar.com" })).rejects.toThrow(
			'A `host` value must include "http://" or "https://" protocol',
		);
	});

	test("should accept custom `cwd` option", async () => {
		let output = await seolint.config({ cwd: fixtures });

		expect(output.host).toBe("https://hello.com");
		expect(output.inputs).toEqual(["https://hello.com/world/"]);
		expect(output.rules).toEqual({ "canonical.href.match": false });
	});

	test("should always prefer `input` and `host` over config file", async () => {
		let output = await seolint.config({
			cwd: fixtures,
			host: "https://x.com",
			input: ["public"],
		});

		expect(output.host).toBe("https://x.com");
		expect(output.inputs).toEqual(["public"]);
		expect(output.rules).toEqual({ "canonical.href.match": false });
	});
});

describe("lint()", () => {
	test("should return `undefined` when valid", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		expect(await seolint.lint(GOOD, config)).toBeUndefined();
	});

	test("should report every failed rule with its location", async () => {
		let config = await seolint.config();
		expect(await seolint.lint(BAD, config)).toEqual(BAD_REPORT);
	});

	test("should report each failure of the same rule", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		let html = GOOD.replace(
			'<img src="x.png" alt="a photo" />',
			'<img src="a.png" />\n<img src="b.png" />',
		);

		let output = await seolint.lint(html, config);
		expect(output).toEqual({
			"image.alt.exists": [
				{ message: "Must have an `alt` attribute", line: 13, col: 30 },
				{ message: "Must have an `alt` attribute", line: 14, col: 1 },
			],
		});
	});

	test("should skip disabled rules", async () => {
		let config = await seolint.config();
		config.rules = { "image.alt.exists": false, "title.content.null": false };

		let output = await seolint.lint(BAD, config);
		expect(output).not.toHaveProperty("image.alt.exists");
		expect(output).not.toHaveProperty("title.content.null");
	});

	test("should pass rule options to checks", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		config.rules = { "title.content.length": { max: 5 } };

		expect(await seolint.lint(GOOD, config)).toEqual({
			"title.content.length": [
				{ message: "Must not have more than 5 characters", line: 4, col: 3 },
			],
		});
	});

	test("should not crash when `exists` rules are disabled", async () => {
		let config = await seolint.config();
		config.rules = {
			"title.exists": false,
			"canonical.exists": false,
			"description.exists": false,
			"viewport.exists": false,
		};

		let output = await seolint.lint("<html><head></head></html>", config);
		expect(output).toBeUndefined();
	});

	test("should treat absolute `host` links as internal", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		let html = GOOD.replace(
			'href="/about/"',
			'href="https://example.com/About/"',
		);

		expect(await seolint.lint(html, config)).toEqual({
			"link.internal.lowercase": [
				{
					message: "Internal links should not include uppercase",
					line: 13,
					col: 3,
				},
			],
		});
	});

	test("should treat unparsable links as external", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		let html = GOOD.replace('href="/about/"', 'href="http://["');
		expect(await seolint.lint(html, config)).toBeUndefined();
	});

	test("should run custom plugins", async () => {
		let output = await seolint.lint(GOOD, {
			plugins: [
				(context) => context.assert("custom.rule", false, "custom failure"),
			],
		});

		expect(output).toEqual({ "custom.rule": [{ message: "custom failure" }] });
	});

	test("should reject when a plugin throws", async () => {
		let boom: Plugin = function boom() {
			throw new TypeError("nope");
		};

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

		await seolint.lint(BAD, await seolint.config());

		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		warn.mockRestore();
		error.mockRestore();
	});
});

describe("fs()", () => {
	let tmp: string;

	beforeAll(async () => {
		tmp = await mkdtemp(join(tmpdir(), "seolint-"));
		await mkdir(join(tmp, "a/b"), { recursive: true });
		await writeFile(join(tmp, "a/b/deep.html"), BAD);
		await writeFile(join(tmp, "a/notes.txt"), BAD);
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
		let config = await seolint.config();
		let file = join(site, "sub/bad.html");
		expect(await seolint.fs(file, config)).toEqual({ [file]: BAD_REPORT });
	});

	test("should ignore non-HTML files", async () => {
		let config = await seolint.config();
		expect(
			await seolint.fs(join(fixtures, "seolint.config.js"), config),
		).toEqual({});
	});

	test("should walk a directory", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		expect(await seolint.fs(site, config)).toEqual({
			[join(site, "sub/bad.html")]: BAD_HOST_REPORT,
		});
	});

	test("should walk nested and symlinked files, in sorted order", async () => {
		let config = await seolint.config();
		let output = await seolint.fs(tmp, config);
		let keys = Object.keys(output);

		expect(keys).toHaveLength(102);
		expect(keys).toEqual([...keys].sort());
		expect(keys).toContain(join(tmp, "a/b/deep.html"));
		expect(keys).toContain(join(tmp, "linked.html"));
		expect(keys).not.toContain(join(tmp, "a/notes.txt"));
		expect(keys.some((x) => x.includes("linked-dir"))).toBe(false);
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
		let config = await seolint.config();
		config.rules = { "canonical.href.match": false };
		expect(
			await seolint.url(new URL("/good/", server.url).href, config),
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
		let config = await seolint.config({ input: ["site/sub"] });
		expect(await seolint.run(config, { cwd: fixtures })).toEqual({
			[join(site, "sub/bad.html")]: BAD_REPORT,
		});
	});

	test("should lint overlapping inputs once", async () => {
		let config = await seolint.config({
			host: "https://example.com",
			input: ["site", "site/sub/bad.html"],
		});
		let output = await seolint.run(config, { cwd: fixtures });
		expect(Object.keys(output)).toEqual([join(site, "sub/bad.html")]);
	});

	test("should reject when an input fails", async () => {
		let config = await seolint.config({ input: ["site", "missing"] });
		await expect(seolint.run(config, { cwd: fixtures })).rejects.toThrow(
			"ENOENT",
		);
	});
});
