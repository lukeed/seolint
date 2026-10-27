import { readFile } from "node:fs/promises";
import { relative, sep } from "node:path";

/** One page to lint. It is plain data, so it can be sent to a worker. */
export type Target = {
	input: string;
	/** The path that `ignore` patterns match: relative to the root, or the URL path. */
	path: string;
	url: string | undefined;
	host: string | undefined;
	/** Whether `input` is a URL to fetch, not a file to read. */
	remote: boolean;
};

/**
 * The URL of `file` on the site at `host`, without `index.html`.
 * @example
 * address("public", "public/blog/index.html", "https://example.com"); //=> "https://example.com/blog/"
 */
function address(
	root: string,
	file: string,
	host: string | undefined,
): string | undefined {
	if (!host || !URL.canParse(host)) return;
	let path = relative(root, file).split(sep).join("/");
	path = path.replace(/(^|\/)index\.html?$/, "$1");
	return new URL(path, host.endsWith("/") ? host : host + "/").href;
}

export function local(
	root: string,
	file: string,
	host: string | undefined,
): Target {
	return {
		input: file,
		path: relative(root, file).split(sep).join("/"),
		url: address(root, file, host),
		host,
		remote: false,
	};
}

export function remote(href: string, host: string | undefined): Target {
	return {
		input: href,
		path: new URL(href).pathname.replace(/^\//, ""),
		url: href,
		host: host || new URL(href).origin,
		remote: true,
	};
}

/**
 * The HTML of a target: the file contents, or the fetched page.
 * @throws {Error} for a failed request or a response that is not HTML.
 */
export async function read(target: Target): Promise<string> {
	if (!target.remote) return readFile(target.input, "utf8");

	let res = await fetch(target.input);
	if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

	let type = res.headers.get("content-type") || "";
	if (!type.includes("text/html")) {
		throw new Error('Invalid "Content-Type" header');
	}

	return res.text();
}
