import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as sitemap from "./sitemap";

describe("read", () => {
	let tmp: string;

	beforeAll(async () => {
		tmp = await mkdtemp(join(tmpdir(), "seolint-sitemap-"));
	});

	afterAll(async () => {
		await rm(tmp, { recursive: true, force: true });
	});

	test("reads sitemap.xml without robots.txt", async () => {
		await writeFile(
			join(tmp, "sitemap.xml"),
			"<urlset><url><loc> https://example.com/?a=1&amp;b=2 </loc></url></urlset>",
		);
		expect(await sitemap.read(tmp, "https://example.com")).toEqual({
			entries: [
				{ url: "https://example.com/?a=1&b=2", file: join(tmp, "sitemap.xml") },
			],
			missing: [],
			declared: false,
		});
	});

	test("reports a missing sitemap.xml", async () => {
		let empty = await mkdtemp(join(tmpdir(), "seolint-sitemap-"));
		expect(await sitemap.read(empty, undefined)).toEqual({
			entries: [],
			missing: [join(empty, "sitemap.xml")],
			declared: false,
		});
		await rm(empty, { recursive: true });
	});

	test("follows each index once, and skips other origins", async () => {
		await writeFile(
			join(tmp, "robots.txt"),
			"Sitemap: https://example.com/index.xml\nSitemap: https://cdn.com/index.xml",
		);
		await writeFile(
			join(tmp, "index.xml"),
			"<sitemapindex><sitemap><loc>https://example.com/index.xml</loc></sitemap><sitemap><loc>https://example.com/sitemap.xml</loc></sitemap></sitemapindex>",
		);
		let output = await sitemap.read(tmp, "https://example.com");
		expect(output.declared).toBe(true);
		expect(output.missing).toEqual([]);
		expect(output.entries.map((x) => x.url)).toEqual([
			"https://example.com/?a=1&b=2",
		]);
	});
});
