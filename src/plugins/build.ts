import { readdir } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";

/**
 * Every file in the roots, as a URL path from its root, such as `/blog/index.html`.
 * @example
 * let known = await build.files(["public"]); //=> Set { "/index.html", "/blog/index.html" }
 */
export async function files(roots: string[]): Promise<Set<string>> {
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
 * Wrap `fn` so that it runs once for each path, since many links share one.
 * @example
 * let exists = build.memo((path) => build.resolvable(known, path));
 */
export function memo<T>(fn: (path: string) => T): (path: string) => T {
	let cache = new Map<string, { value: T }>();
	return (path) => {
		let hit = cache.get(path);
		if (hit) return hit.value;
		let value = fn(path);
		cache.set(path, { value });
		return value;
	};
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
 * @example
 * build.resolvable(new Set(["/about.html"]), "/about"); //=> true
 */
export function resolvable(known: Set<string>, path: string): boolean {
	let base = posix.join("/", decode(path));
	let candidates = path.endsWith("/")
		? [base + "index.html"]
		: [base, base + "/index.html", base + ".html"];
	return candidates.some((x) => known.has(x));
}

/**
 * How the page for the URL `path` is built: as a `folder` with an
 * `index.html`, as a `file` with `.html` added, or `undefined` when neither
 * or both exist, or the path names a file, such as `/menu.pdf`.
 * @example
 * build.shape(new Set(["/about/index.html"]), "/about"); //=> "folder"
 * build.shape(new Set(["/about.html"]), "/about/"); //=> "file"
 */
export function shape(
	known: Set<string>,
	path: string,
): "folder" | "file" | undefined {
	let base = posix.join("/", decode(path)).replace(/\/$/, "");
	if (!base || /\.[^/]*$/.test(base)) return;
	let folder = known.has(base + "/index.html");
	let file = known.has(base + ".html");
	if (folder !== file) return folder ? "folder" : "file";
}
