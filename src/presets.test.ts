import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import * as seolint from "./index";
import * as presets from "./presets";
import * as setup from "./setup";
import * as merger from "./merge";

import type { Config } from "./types";

const site = join(resolve(import.meta.dir, "fixtures"), "site");
const BAD = await Bun.file(join(site, "sub/bad.html")).text();

/** The rules that a config turns on, with their severity. */
function enabled(config: Config): Record<string, string> {
	let output: Record<string, string> = {};
	let merged: Config = {};
	merger.merge(merged, config);
	for (let [rule, info] of setup.setup(merged).rules) {
		if (info.state) output[rule] = info.state.severity;
	}
	return output;
}

describe("presets", () => {
	test("strict turns every warning into an error", () => {
		let rules = enabled({ presets: [presets.strict] });
		expect(Object.values(rules).every((x) => x === "error")).toBe(true);
		expect(rules["og.title"]).toBe("error");
		expect(rules["site.sitemap"]).toBe("error");
	});

	test("strict leaves rules that are off by default off", () => {
		let rules = enabled({ presets: [presets.strict] });
		expect(rules["link.external.limit"]).toBeUndefined();
		expect(rules["link.blank.noopener"]).toBeUndefined();
	});

	test("essentials keeps only the rules that affect search results", () => {
		let rules = Object.keys(enabled({ presets: [presets.essentials] }));
		expect(rules).toContain("title.content.length");
		expect(rules).toContain("site.link.exists");
		expect(rules).not.toContain("og.title");
		expect(rules).not.toContain("link.internal.trailing");
		expect(rules).not.toContain("html.favicon");
	});

	test("staging allows noindex and skips production checks", () => {
		let rules = enabled({ presets: [presets.staging] });
		for (let rule of [
			"robots.noindex",
			"robots.nofollow",
			"site.robots",
			"site.sitemap",
			"canonical.href.self",
			"og.url",
		]) {
			expect(rules[rule]).toBeUndefined();
		}
		expect(rules["title.exists"]).toBe("error");
	});

	test("a config pattern overrides a preset's exact names", () => {
		let rules = enabled({
			presets: [presets.strict],
			rules: { "og.*": false },
		});
		expect(Object.keys(rules).some((x) => x.startsWith("og."))).toBe(false);
		expect(rules["twitter.card"]).toBe("error");
	});

	test("applies presets passed straight to lint() and fs()", async () => {
		let config = { host: "https://example.com", presets: [presets.essentials] };
		let rules = (await seolint.lint(BAD, config))?.map((x) => x.rule) ?? [];
		expect(rules).toContain("title.content.null");
		expect(rules).not.toContain("og.title");

		let ignored = await seolint.fs(site, { presets: [{ ignore: ["sub/**"] }] });
		expect(Object.keys(ignored).some((x) => x.endsWith("bad.html"))).toBe(
			false,
		);
	});
});
