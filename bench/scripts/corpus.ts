import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = join(import.meta.dirname, "..", "corpus");

const PAGES = [
	"https://en.wikipedia.org/wiki/HTML",
	"https://en.wikipedia.org/wiki/Search_engine_optimization",
	"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a",
	"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
	"https://github.com/oven-sh/bun",
	"https://www.bbc.com/news",
	"https://www.theguardian.com/international",
	"https://www.apple.com/",
	"https://docs.python.org/3/library/functions.html",
	"https://blog.cloudflare.com/",
	"https://news.ycombinator.com/",
	"https://www.rust-lang.org/",
];

/**
 * Read every cached corpus page.
 * @example
 * let pages = await load(); //=> [{ name: "en.wikipedia.org_wiki_HTML", html: "..." }, ...]
 */
export async function load(): Promise<{ name: string; html: string }[]> {
	let files = await readdir(DIR).catch(() => []);
	if (files.length === 0)
		throw new Error("Missing corpus. Run `bun run bench build` first.");
	return Promise.all(
		files.sort().map(async (file) => ({
			name: file.replace(/\.html$/, ""),
			html: await readFile(join(DIR, file), "utf8"),
		})),
	);
}

/**
 * Download every page in `PAGES` that is not cached yet. Cached pages are kept,
 * so results stay comparable across runs.
 * @example
 * await fill(); //=> ["en.wikipedia.org_wiki_HTML", ...] (the pages it downloaded)
 */
export async function fill(): Promise<string[]> {
	await mkdir(DIR, { recursive: true });
	let cached = new Set(await readdir(DIR));
	let added: string[] = [];

	for (let url of PAGES) {
		let name = url
			.replace(/^https?:\/\//, "")
			.replace(/[^\w.-]+/g, "_")
			.replace(/_$/, "");
		if (cached.has(name + ".html")) continue;

		let res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
		if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
		await writeFile(join(DIR, name + ".html"), await res.text());
		added.push(name);
	}

	return added;
}
