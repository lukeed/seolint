import { describe, expect, test } from "bun:test";

import * as build from "./build";

describe("memo", () => {
	test("runs once for each path, even for a falsy result", () => {
		let calls: string[] = [];
		let shape = build.memo((path) => {
			calls.push(path);
			return path === "/a" ? undefined : path.length;
		});
		expect([shape("/a"), shape("/a"), shape("/bb"), shape("/bb")]).toEqual([
			undefined,
			undefined,
			3,
			3,
		]);
		expect(calls).toEqual(["/a", "/bb"]);
	});
});

describe("shape", () => {
	let known = new Set(["/a/index.html", "/b.html", "/c.html", "/c/index.html"]);

	test("tells folder pages from file pages", () => {
		expect(build.shape(known, "/a")).toBe("folder");
		expect(build.shape(known, "/b/")).toBe("file");
		expect(build.shape(known, "/c")).toBeUndefined();
		expect(build.shape(known, "/menu.pdf")).toBeUndefined();
	});
});
