import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "@lukeed/html";

import * as setup from "./setup";

import type { Node } from "@lukeed/html";
import type { Argv, Context, Config, Dict, Message, Report } from "./types";

export type {
	Argv,
	Config,
	Context,
	Dict,
	Message,
	Plugin,
	Report,
	Rules,
	Setting,
} from "./types";

const CONCURRENCY = 32;
const HTTP = /^https?:\/\//;
const HTML = /\.html?$/;

/**
 * Lint an HTML string with the built-in plugins and any `config.plugins`.
 * Resolves with `undefined` when every rule passes. Rejects when a plugin
 * throws, or when the config names an unknown rule.
 * @example
 * let messages = await lint("<html>...</html>");
 * let custom = await lint("<html>...</html>", await resolve());
 */
export async function lint(
	html: string,
	config: Config = {},
): Promise<Message[] | undefined> {
	let { plugins, rules } = setup.setup(config);

	let document = parse(html);
	let output: Message[] = [];

	let state = (rule: string): setup.State => {
		let found = rules.get(rule);
		if (found === undefined)
			throw new Error(`Rule "${rule}" is not declared by any plugin`);
		return found;
	};

	let context: Context = {
		options: { host: config.host },
		load(rule) {
			let found = state(rule);
			return found === false ? undefined : found;
		},
		report(rule, message, node) {
			if (state(rule) === false) return;
			let entry: Message = { rule, message };
			if (node) {
				let { line, column } = document.position(node.start);
				entry.line = line;
				entry.col = column;
			}
			output.push(entry);
		},
		assert(
			rule: string,
			check: boolean | ((options: Dict) => boolean),
			message: string,
			node?: Node,
		) {
			let found = state(rule);
			if (found === false) return;
			let passed =
				typeof check === "function"
					? check(typeof found === "object" ? found : {})
					: check;
			passed || context.report(rule, message, node);
		},
	};

	for (let plugin of plugins) {
		try {
			await plugin.run(context, document);
		} catch (err) {
			throw new Error(`Plugin "${plugin.name}" failed`, { cause: err });
		}
	}

	if (output.length > 0) return output;
}

/**
 * Lint an HTML file, or every HTML file inside a directory.
 * @example
 * let report = await fs('public', await resolve());
 */
export async function fs(path: string, config?: Config): Promise<Report> {
	return collect(await walk(path), (file) => read(file, config));
}

/**
 * Fetch and lint a URL. Uses its origin as `host` unless one is set.
 * @example
 * let report = await url('https://example.com', await resolve());
 */
export async function url(href: string, config?: Config): Promise<Report> {
	return collect([href], (x) => request(x, config));
}

/**
 * Lint all `config.inputs`, which must be all URLs or all file-system paths.
 * @example
 * let report = await run(await resolve({ input: ['public'] }));
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
	config?: Config,
): Promise<Message[] | undefined> {
	return lint(await readFile(file, "utf8"), config);
}

async function request(
	href: string,
	config?: Config,
): Promise<Message[] | undefined> {
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
	action: (target: string) => Promise<Message[] | undefined>,
): Promise<Report> {
	let results: (Message[] | undefined)[] = [];
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
