import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";

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
	"site.canonical.exists": true,
	"site.page.linked": true,
	"site.robots": true,
	"site.robots.noindex": true,
	"site.sitemap": true,
	"site.sitemap.entries": true,
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

async function canonicals(site: Context, pages: Page<Data>[]): Promise<void> {
	let origin = site.options.host && URL.parse(site.options.host)?.origin;
	if (!site.load("site.canonical.exists") || !origin) return;
	let known = await build.files(site.roots);
	for (let page of pages) {
		let url = page.data.canonical && URL.parse(page.data.canonical);
		if (!url || url.origin !== origin) continue;
		if (build.resolvable(known, url.pathname)) continue;
		site.report(
			"site.canonical.exists",
			`Must point to a page of the build, not ${page.data.canonical}`,
			page.input,
		);
	}
}

/**
 * Report the pages that no other page links to, except the home page.
 */
function linked(site: Context, pages: Page<Data>[]): void {
	if (!site.load("site.page.linked") || !site.options.host) return;
	let origin = URL.parse(site.options.host)?.origin;
	if (!origin) return;

	let incoming = new Set<string>();
	for (let page of pages) {
		let self = page.url && address.normalize(page.url);
		for (let link of page.data.links) {
			let url = address.normalize(origin + link.path);
			if (url && url !== self) incoming.add(url);
		}
	}

	for (let page of pages.filter(primary)) {
		let url = page.url && address.normalize(page.url);
		if (!url || url === origin + "/" || incoming.has(url)) continue;
		site.report(
			"site.page.linked",
			"Must have a link from another page",
			page.input,
		);
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

/**
 * Why a sitemap should not list `entry`, or `undefined` when it may.
 */
function unlisted(
	entry: sitemap.Entry,
	origin: string | undefined,
	robots: robotstxt.Robots,
	known: Set<string>,
	pages: Map<string, Page<Data>>,
): string | undefined {
	let url = URL.parse(entry.url);
	if (!url) return `Must list a valid URL, not ${entry.url}`;
	if (url.protocol === "http:") return `Must use https://, not ${entry.url}`;
	if (origin && url.origin !== origin) return;
	if (!robotstxt.allowed(robots, "googlebot", url.pathname + url.search)) {
		return `Must not list ${entry.url}, which robots.txt blocks`;
	}
	let page = pages.get(address.normalize(entry.url) ?? "");
	if (!page) {
		if (build.resolvable(known, url.pathname)) return;
		return `Must not list ${entry.url}, which is not a page of the build`;
	}
	if (page.data.noindex) return `Must not list ${entry.url}, which has noindex`;
	if (!primary(page)) {
		return `Must not list ${entry.url}, whose canonical URL is ${page.data.canonical}`;
	}
}

/**
 * Report the pages with `noindex` that robots.txt blocks, since a crawler
 * never fetches them, and so never sees the `noindex`.
 */
async function blocked(site: Context, pages: Page<Data>[]): Promise<void> {
	if (!site.load("site.robots.noindex")) return;
	for (let root of site.roots) {
		let text = await readFile(join(root, "robots.txt"), "utf8").catch(() => "");
		let robots = robotstxt.parse(text);
		for (let page of pages) {
			let url = page.url && URL.parse(page.url);
			if (!url || !page.data.noindex || !page.input.startsWith(root + sep)) {
				continue;
			}
			if (robotstxt.allowed(robots, "googlebot", url.pathname)) continue;
			site.report(
				"site.robots.noindex",
				"Must not be blocked by robots.txt, or search engines never see its noindex",
				page.input,
			);
		}
	}
}

async function sitemaps(site: Context, pages: Page<Data>[]): Promise<void> {
	let entriesRule = site.load("site.sitemap.entries");
	if (!site.load("site.sitemap") && !entriesRule) return;

	let origin = site.options.host
		? URL.parse(site.options.host)?.origin
		: undefined;
	let known = await build.files(site.roots);
	let byUrl = new Map(
		pages.flatMap((page) => {
			let url = page.url && address.normalize(page.url);
			return url ? [[url, page] as const] : [];
		}),
	);
	let listed = new Set<string>();
	let found = false;
	for (let root of site.roots) {
		let { entries, missing, declared } = await sitemap.read(root, origin);
		let text = await readFile(join(root, "robots.txt"), "utf8").catch(() => "");
		let robots = robotstxt.parse(text);
		for (let entry of entriesRule ? entries : []) {
			let reason = unlisted(entry, origin, robots, known, byUrl);
			if (reason) site.report("site.sitemap.entries", reason, entry.file);
		}
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
		"site.canonical.exists":
			"A canonical link to the site points to a page of the build.",
		"site.page.linked": ["warn", "Every page has a link from another page."],
		"site.robots": [
			"warn",
			"A robots.txt exists, and does not block every crawler.",
		],
		"site.robots.noindex":
			"robots.txt does not block a page with noindex, so search engines see it.",
		"site.sitemap": ["warn", "A sitemap exists, and lists every page."],
		"site.sitemap.entries": [
			"warn",
			"A sitemap lists only https pages of the build that search engines can index and crawl.",
		],
	}),
	run(context, document): Data {
		let title = document.find("head > title");
		let description = document.find("meta[name=description i]");
		let links: Link[] = [];

		let host = context.options.host;
		let origin = host ? URL.parse(host)?.origin : undefined;
		let base = URL.parse(context.url ?? host ?? "")?.href;

		let follow =
			context.load("site.link.exists") || context.load("site.page.linked");
		if (origin && base && follow) {
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
		await canonicals(site, pages);
		linked(site, pages);
		await robots(site);
		await blocked(site, pages);
		await sitemaps(site, pages);
	},
});
