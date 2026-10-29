import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { detach } from "../detach";
import { plugin } from "../plugin";
import * as address from "./address";
import * as build from "./build";
import * as directives from "./directives";
import * as about from "./meta";
import * as robotstxt from "./robotstxt";
import * as sitemap from "./sitemap";

import type { Page, Position, Site } from "../types";

type Link = {
	/** The URL path of the target, without the search or hash. */
	path: string;
	position: Position;
};

type Text = { text: string; position: Position };

type Data = {
	title: Text | undefined;
	description: Text | undefined;
	links: Link[];
	/** Whether the page asks search engines to leave it out, with `noindex` or `none`. */
	noindex: boolean;
	/** The absolute URL of the page's canonical link, if any. */
	canonical: string | undefined;
};

const rules = {
	"site.title.unique": true,
	"site.description.unique": true,
	"site.link.exists": true,
	"site.robots": true,
	"site.sitemap": true,
};

type Context = Site<typeof rules>;

/**
 * @example
 * others(1); //=> "1 other page uses"
 */
function others(total: number): string {
	return total === 1 ? "1 other page uses" : `${total} other pages use`;
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

/**
 * Report the pages that share a title or a description, ignoring case.
 */
function unique(
	site: Context,
	pages: Page<Data>[],
	field: "title" | "description",
): void {
	let groups = new Map<string, { input: string; value: Text }[]>();
	for (let page of pages) {
		let value = page.data[field];
		let key = value?.text.trim().toLowerCase();
		if (!value || !key) continue;
		let group = groups.get(key) ?? [];
		group.push({ input: page.input, value });
		groups.set(key, group);
	}

	for (let group of groups.values()) {
		if (group.length < 2) continue;
		for (let item of group) {
			site.report(
				field === "title" ? "site.title.unique" : "site.description.unique",
				`Must be unique; ${others(group.length - 1)} the same ${field}`,
				item.input,
				item.value.position,
			);
		}
	}
}

async function links(site: Context, pages: Page<Data>[]): Promise<void> {
	if (!site.load("site.link.exists")) return;
	let known = await build.files(site.roots);
	for (let page of pages) {
		for (let link of page.data.links) {
			if (build.resolvable(known, link.path)) continue;
			site.report(
				"site.link.exists",
				`Must point to a file that exists, not ${link.path}`,
				page.input,
				link.position,
			);
		}
	}
}

async function robots(site: Context): Promise<void> {
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
}

async function sitemaps(site: Context, pages: Page<Data>[]): Promise<void> {
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

	for (let page of pages.filter(primary)) {
		let url = page.url && address.normalize(page.url);
		if (url && !listed.has(url)) {
			site.report(
				"site.sitemap",
				`Must be listed in sitemap.xml, as ${page.url}`,
				page.input,
			);
		}
	}
}

export const site = plugin({
	name: "site",
	rules,
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
		let description = document.find("meta[name=description i]");
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

		let noindex =
			directives
				.tags(document)
				.some((x) =>
					directives.noindex(directives.meta(x.getAttr("content") ?? "")),
				) ||
			directives.noindex(
				directives.header(context.headers?.get("x-robots-tag") ?? ""),
			);
		let href = document.find("link[rel~=canonical i]")?.getAttr("href");
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
		unique(site, shown, "title");
		unique(site, shown, "description");

		if (site.roots.length === 0) return;
		await links(site, pages);
		await robots(site);
		await sitemaps(site, pages);
	},
});
