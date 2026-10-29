import { describe, expect, test } from "bun:test";

import * as robotstxt from "./robotstxt";

describe("parse", () => {
	test("groups consecutive user agents", () => {
		let robots = robotstxt.parse(
			"Disallow: /early/\nUser-agent: *\nUser-agent: Googlebot # both\nDisallow: /\n\nUser-agent: bingbot\nAllow: /\nSitemap: https://example.com/sitemap.xml",
		);
		expect(robots).toEqual({
			groups: [
				{ agents: ["*", "googlebot"], rules: [{ allow: false, path: "/" }] },
				{ agents: ["bingbot"], rules: [{ allow: true, path: "/" }] },
			],
			sitemaps: ["https://example.com/sitemap.xml"],
		});
	});

	test("ignores an empty Disallow", () => {
		expect(robotstxt.parse("User-agent: *\nDisallow:").groups).toEqual([
			{ agents: ["*"], rules: [] },
		]);
	});
});

describe("allowed", () => {
	test("uses the most specific group", () => {
		let robots = robotstxt.parse(
			"User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow: /private/",
		);
		expect(robotstxt.allowed(robots, "Googlebot", "/a/")).toBe(true);
		expect(robotstxt.allowed(robots, "googlebot", "/private/a")).toBe(false);
		expect(robotstxt.allowed(robots, "bingbot", "/a/")).toBe(false);
	});

	test("prefers the longest rule, and Allow on a tie", () => {
		let robots = robotstxt.parse(
			"User-agent: *\nDisallow: /blog/\nAllow: /blog/public/\nDisallow: /x\nAllow: /x",
		);
		expect(robotstxt.allowed(robots, "*", "/blog/a/")).toBe(false);
		expect(robotstxt.allowed(robots, "*", "/blog/public/a/")).toBe(true);
		expect(robotstxt.allowed(robots, "*", "/x")).toBe(true);
	});

	test("matches * and $ patterns", () => {
		let robots = robotstxt.parse(
			"User-agent: *\nDisallow: /*.pdf$\nDisallow: /a*/b",
		);
		expect(robotstxt.allowed(robots, "*", "/files/menu.pdf")).toBe(false);
		expect(robotstxt.allowed(robots, "*", "/files/menu.pdf?x")).toBe(true);
		expect(robotstxt.allowed(robots, "*", "/abc/b/")).toBe(false);
		expect(robotstxt.allowed(robots, "*", "/c/b/")).toBe(true);
	});

	test("allows everything without rules", () => {
		expect(robotstxt.allowed(robotstxt.parse(""), "*", "/")).toBe(true);
	});
});
