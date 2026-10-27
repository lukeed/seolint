import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "node-html-parser";
import * as conf from "./config";

import type { Node } from "node-html-parser";
import type { Argv, Context, Config, Message, Report, Messages } from "./types";

export type {
	Argv,
	Config,
	Context,
	Dict,
	Message,
	Messages,
	Plugin,
	Report,
	Rules,
} from "./types";

const CONCURRENCY = 32;
const HTTP = /^https?:\/\//;
const HTML = /\.html?$/;

/**
 * Load the nearest `seolint.config.*` file and apply CLI-style overrides.
 * @example
 * let options = await config({ host: 'https://example.com', input: ['public'] });
 */
export async function config(options: Argv = {}): Promise<Config> {
	let cwd = resolve(options.cwd || ".");

	let value = await conf.load(cwd);
	if (options.host) value.host = options.host;
	if (options.input) value.inputs = options.input;

	if (value.host && !HTTP.test(value.host)) {
		throw new Error(
			'A `host` value must include "http://" or "https://" protocol',
		);
	}

	return value;
}

/**
 * Lint an HTML string. Resolves with `undefined` when every rule passes.
 * Rejects when a plugin throws.
 * @example
 * let messages = await lint('<html>...</html>', await config());
 */
export async function lint(
	html: string,
	config?: Omit<Config, "inputs">,
): Promise<Messages | undefined> {
	let { plugins = [], rules = {}, ...rest } = config || {};

	let document = parse(html);
	let output: Messages = {};
	let invalid = false;

	let breaks: number[] = [];
	for (let i = html.indexOf("\n"); i !== -1; i = html.indexOf("\n", i + 1)) {
		breaks.push(i);
	}

	let context: Context = {
		get options() {
			return rest;
		},
		load(title) {
			let tmp = rules[title];
			return tmp == null || tmp;
		},
		report(title, message, node) {
			let entry: Message = { message };

			if (node) {
				let offset = node.range[0];
				let lo = 0;
				let hi = breaks.length;
				while (lo < hi) {
					let mid = (lo + hi) >>> 1;
					if (breaks[mid] < offset) lo = mid + 1;
					else hi = mid;
				}
				entry.line = lo + 1;
				entry.col = offset - (lo > 0 ? breaks[lo - 1] + 1 : 0) + 1;
			}

			(output[title] ||= []).push(entry);
			invalid = true;
		},
		assert(
			title: string,
			check: boolean | ((o: object) => boolean),
			msg: string,
			node?: Node,
		) {
			let tmp = context.load(title);
			if (!tmp) return;

			let bool =
				typeof check === "function"
					? check(typeof tmp === "object" ? tmp : {})
					: check;

			bool || context.report(title, msg, node);
		},
	};

	for (let fn of plugins) {
		try {
			await fn(context as Context<never>, document);
		} catch (err) {
			throw new Error(`Plugin "${fn.name || "anonymous"}" failed`, {
				cause: err,
			});
		}
	}

	if (invalid) return output;
}

/**
 * Lint an HTML file, or every HTML file inside a directory.
 * @example
 * let report = await fs('public', await config());
 */
export async function fs(
	path: string,
	config?: Omit<Config, "inputs">,
): Promise<Report> {
	return collect(await walk(path), (file) => read(file, config));
}

/**
 * Fetch and lint a URL. Uses its origin as `host` unless one is set.
 * @example
 * let report = await url('https://example.com', await config());
 */
export async function url(
	href: string,
	config?: Omit<Config, "inputs">,
): Promise<Report> {
	return collect([href], (x) => request(x, config));
}

/**
 * Lint all `config.inputs`, which must be all URLs or all file-system paths.
 * @example
 * let report = await run(await config({ input: ['public'] }));
 */
export async function run(config?: Config, options?: Argv): Promise<Report> {
	let cwd = resolve((options && options.cwd) || ".");
	let inputs = (config && config.inputs) || [];
	if (inputs.length === 0) throw new Error("Missing inputs to analyze");

	let remote = inputs.filter((x) => HTTP.test(x)).length;

	if (remote && remote !== inputs.length) {
		throw new Error("Inputs cannot contain both file-system and URL targets");
	}

	if (remote) return collect(inputs, (x) => request(x, config));

	let files = await Promise.all(inputs.map((x) => walk(join(cwd, x))));
	return collect([...new Set(files.flat())], (x) => read(x, config));
}

/**
 * List the HTML files at `path`, which may be a file or a directory.
 * Symlinked files are included; symlinked directories are not followed.
 */
async function walk(path: string): Promise<string[]> {
	let stats = await stat(path);
	if (stats.isFile()) return HTML.test(path) ? [path] : [];

	let files: string[] = [];
	let dirs = [path];

	for (let dir of dirs) {
		for (let entry of await readdir(dir, { withFileTypes: true })) {
			let next = join(dir, entry.name);
			if (entry.isDirectory()) dirs.push(next);
			else if (HTML.test(entry.name)) files.push(next);
		}
	}

	return files.sort();
}

async function read(
	file: string,
	config?: Omit<Config, "inputs">,
): Promise<Messages | undefined> {
	return lint(await readFile(file, "utf8"), config);
}

async function request(
	href: string,
	config?: Omit<Config, "inputs">,
): Promise<Messages | undefined> {
	let res = await fetch(href);
	if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

	let type = res.headers.get("content-type") || "";
	if (!type.includes("text/html")) {
		throw new Error('Invalid "Content-Type" header');
	}

	let host = (config && config.host) || new URL(href).origin;
	return lint(await res.text(), { ...config, host });
}

/**
 * Run `action` on each target with bounded concurrency.
 * Report keys keep the order of `targets`.
 */
async function collect(
	targets: string[],
	action: (target: string) => Promise<Messages | undefined>,
): Promise<Report> {
	let results: (Messages | undefined)[] = [];
	let queue = targets.entries();

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
			for (let [i, target] of queue) {
				try {
					results[i] = await action(target);
				} catch (err) {
					throw new Error(`Failed to lint "${target}"`, { cause: err });
				}
			}
		}),
	);

	let output: Report = {};
	targets.forEach((target, i) => {
		let messages = results[i];
		if (messages) output[target] = messages;
	});
	return output;
}
