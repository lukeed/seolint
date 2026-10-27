import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { join, resolve } from "node:path";

import * as seolint from "./index";

const fixtures = resolve(import.meta.dir, "fixtures");
const site = join(fixtures, "site");

const GOOD = await Bun.file(join(site, "good.html")).text();
const BAD = await Bun.file(join(site, "sub/bad.html")).text();

const BAD_REPORT = {
	"title.content.null": { message: 'Must not include "null" in `title` value' },
	"canonical.href.lowercase": {
		message: "Must not include uppercase character(s)",
	},
	"description.exists": { message: 'A "meta[name=description]" must exist' },
	"viewport.exists": { message: 'A "meta[name=viewport]" tag must exist' },
	"image.alt.exists": { message: "Must have an `alt` attribute" },
};

let warn: ReturnType<typeof spyOn>;
beforeAll(() => {
	warn = spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => {
	warn.mockRestore();
});

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

describe("Assertion", () => {
	test("should extend `Error` class", () => {
		let foo = new seolint.Assertion("foo", "bar");
		expect(foo).toBeInstanceOf(seolint.Assertion);
		expect(foo).toBeInstanceOf(Error);
	});

	test("should have `message`, `stack`, and `rule` properties", () => {
		let foo = new seolint.Assertion("foo", "bar");
		expect(foo.message).toBe("foo");
		expect(foo.stack).toBeString();
		expect(foo.rule).toBe("bar");
	});
});

describe("lint()", () => {
	test("should return `undefined` when valid", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		expect(await seolint.lint(GOOD, config)).toBeUndefined();
	});

	test("should return `Messages` when invalid", async () => {
		let config = await seolint.config();
		expect(await seolint.lint(BAD, config)).toEqual(BAD_REPORT);
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
			"title.content.length": {
				message: "Must not have more than 5 characters",
			},
		});
	});

	test("should not crash when `exists` rules are disabled", async () => {
		let error = spyOn(console, "error");
		let config = await seolint.config();
		config.rules = {
			"title.exists": false,
			"canonical.exists": false,
			"description.exists": false,
			"viewport.exists": false,
		};

		await seolint.lint("<html><head></head><body></body></html>", config);
		expect(error).not.toHaveBeenCalled();
		error.mockRestore();
	});

	test("should treat absolute `host` links as internal", async () => {
		let config = await seolint.config({ host: "https://example.com" });
		let html = GOOD.replace(
			'href="/about/"',
			'href="https://example.com/About/"',
		);

		expect(await seolint.lint(html, config)).toEqual({
			"link.internal.lowercase": {
				message: "Internal links should not include uppercase",
			},
		});
	});

	test("should run custom plugins", async () => {
		let output = await seolint.lint(GOOD, {
			plugins: [
				(context) => context.assert("custom.rule", false, "custom failure"),
			],
		});

		expect(output).toEqual({ "custom.rule": { message: "custom failure" } });
	});
});

describe("fs()", () => {
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
			[join(site, "sub/bad.html")]: {
				...BAD_REPORT,
				"link.internal.lowercase": {
					message: "Internal links should not include uppercase",
				},
			},
		});
	});
});

describe("url()", () => {
	let server: ReturnType<typeof Bun.serve>;

	beforeAll(() => {
		server = Bun.serve({
			port: 0,
			fetch(req) {
				let { pathname } = new URL(req.url);
				if (pathname === "/good/")
					return new Response(GOOD, {
						headers: { "content-type": "text/html" },
					});
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
		await expect(
			seolint.url(new URL("/json", server.url).href),
		).rejects.toThrow('Invalid "Content-Type" header');
	});

	test("should reject failed responses", async () => {
		await expect(
			seolint.url(new URL("/missing", server.url).href),
		).rejects.toThrow("Request failed with status 404");
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
});
