import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import * as corpus from "./corpus.ts";

export const HOST = "https://example.com";
export const SITE = join(import.meta.dirname, "..", "dist", "site");

/** How many copies of each corpus page the site has. */
export const COPIES = 100;

/**
 * Write a site with {@link COPIES} copies of every corpus page, plus a
 * `robots.txt` and a `sitemap.xml`, so the site checks run too.
 */
async function site(pages: { name: string; html: string }[]): Promise<number> {
	await rm(SITE, { recursive: true, force: true });
	let urls: string[] = [];

	for (let i = 0; i < COPIES; i++) {
		for (let page of pages) {
			let path = `${i}/${page.name}/`;
			await mkdir(join(SITE, path), { recursive: true });
			await writeFile(join(SITE, path, "index.html"), page.html);
			urls.push(`${HOST}/${path}`);
		}
	}

	let entries = urls.map((x) => `  <url><loc>${x}</loc></url>`).join("\n");
	await writeFile(
		join(SITE, "sitemap.xml"),
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
	);
	await writeFile(
		join(SITE, "robots.txt"),
		`User-agent: *\nAllow: /\n\nSitemap: ${HOST}/sitemap.xml\n`,
	);

	return urls.length;
}

if (import.meta.main) {
	let added = await corpus.fill();
	console.log(
		added.length > 0
			? `Downloaded ${added.join(", ")}`
			: "Corpus is up to date",
	);

	let count = await site(await corpus.load());
	console.log(
		`Wrote ${count} pages to ${SITE.slice(process.cwd().length + 1)}`,
	);
}
