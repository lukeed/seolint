import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { version } from "../package.json";

const fixtures = resolve(import.meta.dir, "fixtures");
const bin = join(import.meta.dir, "bin.ts");

function seolint(args: string[], stdin?: string) {
	let proc = Bun.spawnSync([process.execPath, bin, ...args], {
		cwd: fixtures,
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
		expect(output.stderr).toContain(" FAIL  site/sub/bad.html\n");
		expect(output.stderr).toContain(
			"✘  Must have an `alt` attribute                 image.alt.exists\n",
		);
		expect(output.stderr).toContain(" FAIL  Reported 6 errors!\n");
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
		expect(Object.keys(JSON.parse(output.stdout)[file])).toHaveLength(6);
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
});
