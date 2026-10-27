import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { plugin } from "../plugin";
import * as about from "./meta";

import type { Position } from "../types";

type Link = {
	/** The absolute URL, without a hash. */
	target: string;
	position: Position;
};

type Data = {
	title: { text: string; position: Position } | undefined;
	description: { text: string; position: Position } | undefined;
	links: Link[];
};

/**
 * Whether a file exists at `path`.
 */
async function exists(path: string): Promise<boolean> {
	return stat(path).then(
		(x) => x.isFile(),
		() => false,
	);
}

/**
 * Whether any root has a file for the URL `path`: the file itself, an
 * `index.html` inside it, or the path with `.html` added.
 */
async function resolvable(roots: string[], path: string): Promise<boolean> {
	let clean = decodeURIComponent(path);
	for (let root of roots) {
		let base = join(root, clean);
		let candidates = clean.endsWith("/")
			? [join(base, "index.html")]
			: [base, join(base, "index.html"), base + ".html"];
		for (let file of candidates) if (await exists(file)) return true;
	}
	return false;
}

/**
 * Whether a robots.txt blocks every crawler from the whole site.
 * @example
 * blocked("User-agent: *\nDisallow: /"); //=> true
 */
function blocked(text: string): boolean {
	let everyone = false;
	for (let raw of text.split(/\r?\n/)) {
		let line = raw.replace(/#.*$/, "").trim();
		let [key, ...rest] = line.split(":");
		let value = rest.join(":").trim();
		if (/^user-agent$/i.test(key)) everyone = value === "*";
		else if (everyone && /^disallow$/i.test(key) && value === "/") return true;
	}
	return false;
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
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}
	return [...groups.values()].filter((x) => x.length > 1);
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
		"site.sitemap": ["warn", "A sitemap.xml exists, and lists every page."],
	}),
	run(context, document): Data {
		let title = document.find("head > title");
		let description = document.find("meta[name=description]");
		let links: Link[] = [];

		let host = context.options.host;
		let origin = host && URL.canParse(host) ? new URL(host).origin : undefined;
		let base = context.url ?? host;

		if (origin && base && URL.canParse(base)) {
			for (let node of document.all("a[href]")) {
				let href = node.getAttr("href") ?? "";
				if (!URL.canParse(href, base)) continue;
				let url = new URL(href, base);
				if (url.origin !== origin) continue;
				url.hash = "";
				url.search = "";
				links.push({
					target: url.href,
					position: document.position(node.start),
				});
			}
		}

		return {
			title: title && {
				text: title.text,
				position: document.position(title.start),
			},
			description: description && {
				text: description.getAttr("content") ?? "",
				position: document.position(description.start),
			},
			links,
		};
	},
	async finish(site, pages) {
		let titles = pages.flatMap((page) =>
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

		let descriptions = pages.flatMap((page) =>
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
			let known = new Map<string, boolean>();
			for (let page of pages) {
				for (let link of page.data.links) {
					let path = new URL(link.target).pathname;
					let found = known.get(path) ?? (await resolvable(site.roots, path));
					known.set(path, found);
					if (!found) {
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
			} else if (blocked(text)) {
				site.report(
					"site.robots",
					'Must not block every crawler with "Disallow: /"',
					file,
				);
			}
		}

		if (!site.load("site.sitemap")) return;

		let listed = new Set<string>();
		let missing: string[] = [];
		for (let root of site.roots) {
			let file = join(root, "sitemap.xml");
			let text = await readFile(file, "utf8").catch(() => undefined);
			if (text === undefined) missing.push(file);
			for (let match of text?.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g) ?? []) {
				listed.add(match[1]);
			}
		}

		for (let file of missing) {
			site.report("site.sitemap", "A sitemap.xml file must exist", file);
		}
		if (missing.length === site.roots.length) return;

		for (let page of pages) {
			if (page.url && !listed.has(page.url)) {
				site.report(
					"site.sitemap",
					`Must be listed in sitemap.xml, as ${page.url}`,
					page.input,
				);
			}
		}
	},
});
