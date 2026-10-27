import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { version } from "../package.json";

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
				'        ✘  A "meta[name=description]" must exist                      description.exists',
				'        ✘  A "meta[name=viewport]" tag must exist                     viewport.exists',
				'   4:3  ✘  Must not include "null" in `title` value                   title.content.null',
				"   4:3  ✘  Must not have less than 10 characters                      title.content.length",
				"   5:3  ✘  Must not include uppercase character(s)                    canonical.href.lowercase",
				'   5:3  ✘  Must point to an "https://" address                        canonical.href.https',
				"   8:3  ✘  Internal links should not include uppercase                link.internal.lowercase",
				'   8:3  ✘  Internal links should not include ".html" suffix           link.internal.pretty',
				'   8:3  ✘  Must include "rel=noopener" when "target=_blank" in use    link.blank.noopener',
				'   8:3  ✘  Must include "rel=noreferrer" when "target=_blank" in use  link.blank.noreferrer',
				"  8:46  ✘  Must have an `alt` attribute                               image.alt.exists",
				"",
				" FAIL  Reported 11 errors!",
				"",
				"",
			].join("\n"),
		);
	});

	test("should pass and exit with 0", () => {
		let output = seolint(["site/good.html", "-H", "https://example.com"]);
		expect(output.code).toBe(0);
		expect(output.stdout).toContain(" PASS  Looks great! 🎉");
	});

	test("should print JSON report", () => {
		let output = seolint(["site/sub", "--json", "-H", "https://example.com"]);
		let file = join(fixtures, "site/sub/bad.html");
		expect(output.code).toBe(0);
		expect(Object.keys(JSON.parse(output.stdout)[file])).toHaveLength(11);
	});

	test("should only set exit code when quiet", () => {
		let output = seolint(["site", "-q", "-H", "https://example.com"]);
		expect(output.code).toBe(1);
		expect(output.stdout).toBe("");
		expect(output.stderr).toBe("");
	});

	test("should lint HTML from stdin", async () => {
		let html = await Bun.file(join(fixtures, "site/good.html")).text();
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
			["sub", "good.html"],
			undefined,
			join(fixtures, "site"),
		);
		let warnings = output.stderr.match(/cannot run `link.internal` rules/g);
		expect(warnings).toHaveLength(1);
	});

	describe("with a crashing plugin", () => {
		let tmp: string;

		beforeAll(async () => {
			tmp = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
			await writeFile(join(tmp, "index.html"), "<html></html>");
			await writeFile(
				join(tmp, "seolint.config.mjs"),
				'export default { plugins: [function boom() { throw new TypeError("nope") }] }',
			);
		});

		afterAll(async () => {
			await rm(tmp, { recursive: true, force: true });
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
