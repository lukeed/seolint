import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import * as robotstxt from "./robotstxt";

const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
};

/** One `<loc>` of a sitemap. */
export type Entry = {
	url: string;
	/** The sitemap file that lists the URL. */
	file: string;
};

/** The sitemaps of one site root. */
export type Sitemaps = {
	/** The URLs that the sitemaps list. */
	entries: Entry[];
	/** The sitemap files that robots.txt or a sitemap index name, but that do not exist. */
	missing: string[];
	/** Whether robots.txt names the sitemaps, instead of the default `sitemap.xml`. */
	declared: boolean;
};

/**
 * The text of each `<loc>` in a sitemap, with its XML entities decoded.
 */
function locs(xml: string): string[] {
	return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((x) =>
		x[1].replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => ENTITIES[name]),
	);
}

/**
 * The file in `root` for a sitemap `url`, or `undefined` when the URL is not on the site.
 */
function local(
	root: string,
	url: string,
	origin: string | undefined,
): string | undefined {
	let parsed = URL.parse(url);
	if (!parsed || (origin && parsed.origin !== origin)) return;
	try {
		var path = decodeURIComponent(parsed.pathname);
	} catch {
		return;
	}
	return join(root, path);
}

async function load(file: string): Promise<string | undefined> {
	let data = await readFile(file).catch(() => undefined);
	if (!data) return;
	return (file.endsWith(".gz") ? gunzipSync(data) : data).toString("utf8");
}

/**
 * Read the sitemaps of a site root: the `Sitemap:` lines of its robots.txt,
 * or else its `sitemap.xml`, and every sitemap that an index lists.
 * @param origin The origin of the site, such as `https://example.com`. Sitemaps on other origins are skipped.
 * @example
 * let { entries, missing } = await sitemap.read("public", "https://example.com");
 */
export async function read(
	root: string,
	origin: string | undefined,
): Promise<Sitemaps> {
	let robots = await load(join(root, "robots.txt"));
	let named = robots ? robotstxt.parse(robots).sitemaps : [];
	let queue = named.flatMap((url) => local(root, url, origin) ?? []);
	let declared = queue.length > 0;
	if (!declared) queue.push(join(root, "sitemap.xml"));

	let entries: Entry[] = [];
	let missing: string[] = [];
	let seen = new Set(queue);

	for (let file of queue) {
		let xml = await load(file);
		if (xml === undefined) {
			missing.push(file);
			continue;
		}
		if (!/<sitemapindex[\s>]/.test(xml)) {
			for (let url of locs(xml)) entries.push({ url, file });
			continue;
		}
		for (let url of locs(xml)) {
			let next = local(root, url, origin);
			if (next && !seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	}

	return { entries, missing, declared };
}
