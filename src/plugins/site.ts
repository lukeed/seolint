import { readdir, readFile } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";

import { detach } from "../detach";
import { plugin } from "../plugin";
import * as address from "./address";
import * as about from "./meta";
import * as robotstxt from "./robotstxt";
import * as sitemap from "./sitemap";

import type { Page, Position } from "../types";

type Link = {
	/** The URL path of the target, without the search or hash. */
	path: string;
	position: Position;
};

type Data = {
	title: { text: string; position: Position } | undefined;
	description: { text: string; position: Position } | undefined;
	links: Link[];
	/** Whether the page asks search engines to leave it out, with `noindex` or `none`. */
	noindex: boolean;
	/** The absolute URL of the page's canonical link, if any. */
	canonical: string | undefined;
};

/**
 * Every file in the roots, as a URL path from its root, such as `/blog/index.html`.
 */
async function files(roots: string[]): Promise<Set<string>> {
	let output = new Set<string>();
	for (let root of roots) {
		for (let entry of await readdir(root, {
			recursive: true,
			withFileTypes: true,
		})) {
			if (!entry.isFile()) continue;
			let path = relative(root, join(entry.parentPath, entry.name));
			output.add("/" + path.split(sep).join("/"));
		}
	}
	return output;
}

/**
 * The URL `path` without percent escapes, or as is when an escape is malformed.
 */
function decode(path: string): string {
	try {
		return decodeURIComponent(path);
	} catch {
		return path;
	}
}

/**
 * Whether `known` has a file for the URL `path`: the file itself, an
 * `index.html` inside it, or the path with `.html` added.
 */
function resolvable(known: Set<string>, path: string): boolean {
	let base = posix.join("/", decode(path));
	let candidates = path.endsWith("/")
		? [base + "index.html"]
		: [base, base + "/index.html", base + ".html"];
	return candidates.some((x) => known.has(x));
}

/**
 * @example
 * others(1); //=> "1 other page uses"
 */
function others(total: number): string {
	return total === 1 ? "1 other page uses" : `${total} other pages use`;
}

/**
 * Group pages that share the same text, keeping only groups of two or more.
 */
function duplicates<T extends { text: string }>(
	items: { input: string; value: T }[],
): { input: string; value: T }[][] {
	let groups = new Map<string, { input: string; value: T }[]>();
	for (let item of items) {
		let key = item.value.text.trim().toLowerCase();
		if (!key) continue;
		let group = groups.get(key);
		if (group) group.push(item);
		else groups.set(key, [item]);
	}
	return [...groups.values()].filter((x) => x.length > 1);
}

/**
 * Whether search engines can show `page` as itself: it has no `noindex`, and
 * its canonical link, if any, points to the page.
 */
function primary(page: Page<Data>): boolean {
	let { noindex, canonical } = page.data;
	if (noindex) return false;
	if (!canonical || !page.url) return true;
	return address.normalize(canonical) === address.normalize(page.url);
}

export const site = plugin({
	name: "site",
	rules: {
		"site.title.unique": true,
		"site.description.unique": true,
		"site.link.exists": true,
		"site.robots": true,
		"site.sitemap": true,
	},
	meta: about.meta({
		"site.title.unique": "Every page has a different title.",
		"site.description.unique": "Every page has a different description.",
		"site.link.exists":
			"Internal links point to files that exist in the build.",
		"site.robots": [
			"warn",
			"A robots.txt exists, and does not block every crawler.",
		],
		"site.sitemap": ["warn", "A sitemap exists, and lists every page."],
	}),
	run(context, document): Data {
		let title = document.find("head > title");
		let description = document.find("meta[name=description]");
		let links: Link[] = [];

		let host = context.options.host;
		let origin = host ? URL.parse(host)?.origin : undefined;
		let base = URL.parse(context.url ?? host ?? "")?.href;

		if (origin && base && context.load("site.link.exists")) {
			for (let node of document.all("a[href]")) {
				let url = URL.parse(node.getAttr("href") ?? "", base);
				if (!url || url.origin !== origin) continue;
				links.push({
					path: url.pathname,
					position: document.position(node.start),
				});
			}
		}

		let robots = document.all("meta[name=robots i], meta[name=googlebot i]");
		let noindex = robots.some((node) =>
			/(^|,)\s*(noindex|none)\s*(,|$)/i.test(node.getAttr("content") ?? ""),
		);
		let href = document.find("link[rel=canonical]")?.getAttr("href");
		let canonical = href ? URL.parse(href, base)?.href : undefined;

		return {
			title: title && {
				text: detach(title.text),
				position: document.position(title.start),
			},
			description: description && {
				text: detach(description.getAttr("content") ?? ""),
				position: document.position(description.start),
			},
			links,
			noindex,
			canonical,
		};
	},
	async finish(site, pages) {
		let shown = pages.filter(primary);

		let titles = shown.flatMap((page) =>
			page.data.title ? [{ input: page.input, value: page.data.title }] : [],
		);
		for (let group of duplicates(titles)) {
			for (let item of group) {
				site.report(
					"site.title.unique",
					`Must be unique; ${others(group.length - 1)} the same title`,
					item.input,
					item.value.position,
				);
			}
		}

		let descriptions = shown.flatMap((page) =>
			page.data.description
				? [{ input: page.input, value: page.data.description }]
				: [],
		);
		for (let group of duplicates(descriptions)) {
			for (let item of group) {
				site.report(
					"site.description.unique",
					`Must be unique; ${others(group.length - 1)} the same description`,
					item.input,
					item.value.position,
				);
			}
		}

		if (site.roots.length === 0) return;

		if (site.load("site.link.exists")) {
			let known = await files(site.roots);
			for (let page of pages) {
				for (let link of page.data.links) {
					let path = link.path;
					if (!resolvable(known, path)) {
						site.report(
							"site.link.exists",
							`Must point to a file that exists, not ${path}`,
							page.input,
							link.position,
						);
					}
				}
			}
		}

		for (let root of site.roots) {
			let file = join(root, "robots.txt");
			let text = await readFile(file, "utf8").catch(() => undefined);
			if (text === undefined) {
				site.report("site.robots", "A robots.txt file must exist", file);
			} else if (!robotstxt.allowed(robotstxt.parse(text), "*", "/")) {
				site.report(
					"site.robots",
					'Must not block every crawler with "Disallow: /"',
					file,
				);
			}
		}

		if (!site.load("site.sitemap")) return;

		let origin = site.options.host
			? URL.parse(site.options.host)?.origin
			: undefined;
		let listed = new Set<string>();
		let found = false;
		for (let root of site.roots) {
			let { entries, missing, declared } = await sitemap.read(root, origin);
			for (let file of missing) {
				site.report(
					"site.sitemap",
					declared
						? "Must exist, because robots.txt or a sitemap index lists it"
						: "A sitemap.xml file must exist",
					file,
				);
			}
			found ||= missing.length === 0 || entries.length > 0;
			for (let entry of entries) {
				let url = address.normalize(entry.url);
				if (url) listed.add(url);
			}
		}
		if (!found) return;

		for (let page of shown) {
			let url = page.url && address.normalize(page.url);
			if (url && !listed.has(url)) {
				site.report(
					"site.sitemap",
					`Must be listed in sitemap.xml, as ${page.url}`,
					page.input,
				);
			}
		}
	},
});
