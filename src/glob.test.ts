import { describe, expect, test } from "bun:test";

import * as glob from "./glob";

describe("glob", () => {
	let matches = (pattern: string, path: string) =>
		glob.compile(pattern).test(path);

	test("matches a whole path", () => {
		expect(matches("404.html", "404.html")).toBe(true);
		expect(matches("drafts/a.html", "drafts/a.html")).toBe(true);
		expect(matches("drafts/a.html", "other/drafts/a.html")).toBe(false);
	});

	test("matches a name without a slash at any depth", () => {
		expect(matches("404.html", "fr/404.html")).toBe(true);
		expect(matches("*.draft.html", "blog/a.draft.html")).toBe(true);
	});

	test("* stays within one segment", () => {
		expect(matches("drafts/*", "drafts/a.html")).toBe(true);
		expect(matches("drafts/*", "drafts/b/a.html")).toBe(false);
	});

	test("** spans segments", () => {
		expect(matches("drafts/**", "drafts/a.html")).toBe(true);
		expect(matches("drafts/**", "drafts/b/c/a.html")).toBe(true);
		expect(matches("**/print/*", "blog/print/a.html")).toBe(true);
		expect(matches("**/print/*", "print/a.html")).toBe(true);
	});

	test("? matches one character", () => {
		expect(matches("page?.html", "page1.html")).toBe(true);
		expect(matches("page?.html", "page10.html")).toBe(false);
	});

	test("ignores a leading ./ or /, and escapes other characters", () => {
		expect(matches("./404.html", "404.html")).toBe(true);
		expect(matches("/drafts/**", "drafts/a.html")).toBe(true);
		expect(matches("a+b.html", "a+b.html")).toBe(true);
		expect(matches("a.html", "aXhtml")).toBe(false);
	});
});
