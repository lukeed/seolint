import { describe, expect, test } from "bun:test";

import * as directives from "./directives";

describe("meta", () => {
	test("splits and lowercases", () => {
		expect(directives.meta(" NoIndex ,follow,, ")).toEqual([
			"noindex",
			"follow",
		]);
	});
});

describe("header", () => {
	test("keeps unscoped and googlebot directives", () => {
		expect(directives.header("noindex")).toEqual(["noindex"]);
		expect(
			directives.header("googlebot: noindex, nofollow, otherbot: none"),
		).toEqual(["noindex", "nofollow"]);
		expect(directives.header("bingbot: noindex")).toEqual([]);
	});

	test("does not read valued directives as user agents", () => {
		expect(
			directives.header(
				"max-snippet: 20, unavailable_after: 2026-01-01, noindex",
			),
		).toEqual(["max-snippet: 20", "unavailable_after: 2026-01-01", "noindex"]);
	});
});

describe("noindex", () => {
	test("matches noindex and none", () => {
		expect(directives.noindex(["none"])).toBe(true);
		expect(directives.noindex(["noindex"])).toBe(true);
		expect(directives.noindex(["nofollow"])).toBe(false);
	});
});
