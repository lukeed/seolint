import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { version } from "../package.json";

import type { Message } from "./types";

const fixtures = resolve(import.meta.dir, "fixtures");
const bin = join(import.meta.dir, "bin.ts");

function seolint(args: string[], stdin?: string, cwd = fixtures) {
	let proc = Bun.spawnSync([process.execPath, bin, ...args], {
		cwd,
		stdin: stdin == null ? "ignore" : Buffer.from(stdin),
		env: { ...process.env, NO_COLOR: "1" },
	});

	return {
		code: proc.exitCode,
		stdout: proc.stdout.toString(),
		stderr: proc.stderr.toString(),
	};
}

describe("bin", () => {
	test("should print help", () => {
		let output = seolint(["--help"]);
		expect(output.code).toBe(0);
		expect(output.stdout).toContain("$ seolint [inputs] [options]");
	});

	test("should print version", () => {
		let output = seolint(["-v"]);
		expect(output.code).toBe(0);
		expect(output.stdout).toBe(`seolint, v${version}\n`);
	});

	test("should report errors and exit with 1", () => {
		let output = seolint(["site", "-H", "https://example.com"]);
		expect(output.code).toBe(1);
		expect(output.stderr).toBe(
			[
				"",
				" FAIL  site/sub/bad.html",
				'        ✘  A <meta charset="utf-8"> tag must exist                         html.charset',
				'        ⚠  A <link rel="icon"> tag must exist                              html.favicon',
				'        ✘  A "meta[name=description]" must exist                           description.exists',
				'        ✘  A "meta[name=viewport]" tag must exist                          viewport.exists',
				"        ✘  A page must have an <h1>                                        heading.exists",
				'        ⚠  A "og:title" meta tag must exist                                og.title',
				'        ⚠  A "og:description" meta tag must exist                          og.description',
				'        ⚠  A "og:image" meta tag must exist                                og.image',
				'        ⚠  A "og:url" meta tag must exist                                  og.url',
				'        ⚠  A "twitter:card" meta tag must exist                            twitter.card',
				"   2:1  ✘  The <html> element must have a `lang` attribute                 html.lang",
				'   4:3  ✘  Must not include "null" in `title` value                        title.content.null',
				"   4:3  ✘  Must not have less than 10 characters                           title.content.length",
				"   5:3  ✘  Must not include uppercase character(s)                         canonical.href.lowercase",
				'   5:3  ✘  Must point to an "https://" address                             canonical.href.https',
				"   5:3  ⚠  Must point to this page, https://example.com/sub/bad.html       canonical.href.self",
				"   8:3  ✘  Internal links should not include uppercase                     link.internal.lowercase",
				'   8:3  ✘  Internal links should not include ".html" suffix                link.internal.pretty',
				'   8:3  ✘  Must include "rel=noopener" when "target=_blank" in use         link.blank.noopener',
				'   8:3  ✘  Must include "rel=noreferrer" when "target=_blank" in use       link.blank.noreferrer',
				"   8:3  ✘  Must point to a file that exists, not /About.html               site.link.exists",
				'  8:46  ✘  Must have an `alt` attribute; use alt="" for decorative images  image.alt.exists',
				"",
				" FAIL  Reported 15 errors and 7 warnings!",
				"",
				"",
			].join("\n"),
		);
	});

	test("should pass and exit with 0", () => {
		let output = seolint(["site/index.html", "-H", "https://example.com"]);
		expect(output.code).toBe(0);
		expect(output.stdout).toContain(" PASS  Looks great! 🎉");
	});

	test("should print JSON report", () => {
		let output = seolint(["site", "--json", "-H", "https://example.com"]);
		let report = JSON.parse(output.stdout);
		expect(output.code).toBe(1);
		expect(Object.keys(report)).toEqual(["site/sub/bad.html"]);
		expect(report["site/sub/bad.html"]).toHaveLength(22);
		let messages: Message[] = report["site/sub/bad.html"];
		expect(messages.find((x) => x.rule === "title.content.null")).toEqual({
			rule: "title.content.null",
			severity: "error",
			message: 'Must not include "null" in `title` value',
			line: 4,
			col: 3,
			docs: "https://github.com/lukeed/seolint/blob/main/docs/rules.md#titlecontentnull",
		});
	});

	test("should only set exit code when quiet", () => {
		let output = seolint(["site", "-q", "-H", "https://example.com"]);
		expect(output.code).toBe(1);
		expect(output.stdout).toBe("");
		expect(output.stderr).toBe("");
	});

	test("should lint HTML from stdin", async () => {
		let html = await Bun.file(join(fixtures, "site/index.html")).text();
		let output = seolint(["-i", "--json", "-H", "https://example.com"], html);
		expect(output.code).toBe(0);
		expect(output.stdout).toBe("{}\n");
	});

	test("should reject missing `--host` value", () => {
		let output = seolint(["site", "-H"]);
		expect(output.code).toBe(1);
		expect(output.stderr).toBe(
			"Option '-H, --host <value>' argument missing\n",
		);
	});

	test("should reject invalid `--host` value", () => {
		let output = seolint(["site", "-H", "example.com"]);
		expect(output.code).toBe(1);
		expect(output.stderr).toContain(
			'A `host` value must include "http://" or "https://" protocol',
		);
	});

	test("should warn once without a `host` value", () => {
		let output = seolint(
			["sub", "index.html"],
			undefined,
			join(fixtures, "site"),
		);
		let warnings = output.stderr.match(/cannot run `link.internal` rules/g);
		expect(warnings).toHaveLength(1);
	});

	test("should align columns across files", async () => {
		let dir = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
		await writeFile(
			join(dir, "a.html"),
			"<html><head></head><body><img src=a></body></html>",
		);
		await writeFile(
			join(dir, "b.html"),
			"<html><head><title>null</title></head>" +
				"\n".repeat(120) +
				"<body><img src=b></body></html>",
		);

		let output = seolint([".", "-H", "https://example.com"], undefined, dir);
		let rows = output.stderr.split("\n").filter((x) => x.includes("✘"));

		expect(new Set(rows.map((x) => x.indexOf("✘"))).size).toBe(1);
		expect(new Set(rows.map((x) => x.lastIndexOf("  ") + 2)).size).toBe(1);
		expect(rows.length).toBeGreaterThan(5);
		await rm(dir, { recursive: true, force: true });
	});

	test("should exit with 0 when there are only warnings", async () => {
		let dir = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
		await writeFile(join(dir, "index.html"), "<html><head></head></html>");
		await writeFile(
			join(dir, "seolint.config.mjs"),
			'export default { rules: { "*": false, "html.favicon": true } }',
		);

		let output = seolint(
			["index.html", "-H", "https://example.com"],
			undefined,
			dir,
		);
		expect(output.code).toBe(0);
		expect(output.stderr).toBe(
			[
				"",
				" WARN  index.html",
				'    ⚠  A <link rel="icon"> tag must exist  html.favicon',
				"",
				" WARN  Reported 1 warning",
				"",
				"",
			].join("\n"),
		);
		await rm(dir, { recursive: true, force: true });
	});

	test("should list rules", () => {
		let output = seolint(["--rules"]);
		let lines = output.stdout.split("\n");
		expect(output.code).toBe(0);
		expect(lines).toContain(
			'  title.content.length           error  The title length is within a range of characters.  {"min":10,"max":60}',
		);
		expect(lines.some((x) => /^ {2}canonical\.href\.match +off /.test(x))).toBe(
			true,
		);
		expect(lines.some((x) => /^ {2}html\.favicon +warn /.test(x))).toBe(true);

		let json = JSON.parse(seolint(["--rules", "--json"]).stdout);
		expect(
			json.find((x: { rule: string }) => x.rule === "link.text.vague"),
		).toEqual({
			rule: "link.text.vague",
			plugin: "link",
			severity: "warn",
			options: {
				words: [
					"click here",
					"here",
					"read more",
					"more",
					"learn more",
					"link",
					"this",
				],
			},
			description: 'A link text describes its target, unlike "click here".',
			docs: "https://github.com/lukeed/seolint/blob/main/docs/rules.md#linktextvague",
		});
	});

	describe("with a crashing plugin", () => {
		let tmp: string;

		beforeAll(async () => {
			tmp = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
			await writeFile(join(tmp, "index.html"), "<html></html>");
			await writeFile(
				join(tmp, "seolint.config.mjs"),
				'export default { plugins: [{ name: "boom", rules: {}, run() { throw new TypeError("nope") } }] }',
			);
		});

		afterAll(async () => {
			await rm(tmp, { recursive: true, force: true });
		});

		test("should reject a plugin that is not an object", async () => {
			await writeFile(
				join(tmp, "seolint.config.mjs"),
				"export default { plugins: [function boom() {}] }",
			);
			let output = seolint(["."], undefined, tmp);
			expect(output.code).toBe(1);
			expect(output.stderr).toStartWith(
				'Invalid plugin at plugins[0]: expected an object with "name", "rules", and "run"',
			);
			await writeFile(
				join(tmp, "seolint.config.mjs"),
				'export default { plugins: [{ name: "boom", rules: {}, run() { throw new TypeError("nope") } }] }',
			);
		});

		test("should print the cause and exit with 1", () => {
			let output = seolint(["."], undefined, tmp);
			expect(output.code).toBe(1);
			expect(output.stdout).toBe("");
			expect(output.stderr).toStartWith(
				[
					`Failed to lint "${join(tmp, "index.html")}"`,
					`  caused by: Plugin "boom" failed`,
					`  caused by: TypeError: nope`,
				].join("\n"),
			);
		});
	});
});
