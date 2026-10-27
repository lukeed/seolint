import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { parse } from "@lukeed/html";

import { detach } from "./detach";
import * as glob from "./glob";
import * as merger from "./merge";
import * as setup from "./setup";

import type { Document, Node } from "@lukeed/html";
import type {
	Argv,
	Config,
	Context,
	Dict,
	Message,
	Position,
	Report,
	Site,
} from "./types";

export type {
	Argv,
	Config,
	Context,
	Dict,
	Message,
	Meta,
	Page,
	Plugin,
	Position,
	Report,
	Rules,
	Setting,
	Severity,
	Site,
} from "./types";

const CONCURRENCY = 32;
const HTTP = /^https?:\/\//;
const HTML = /\.html?$/;

/** One page to lint. */
type Target = {
	input: string;
	/** The path that `ignore` patterns match: relative to the root, or the URL path. */
	path: string;
	url: string | undefined;
	host: string | undefined;
	html(): Promise<string>;
};

/** The messages of one page, and what each plugin's `run` returned. */
type Result = {
	messages: Message[];
	data: Map<string, unknown>;
};

/**
 * The config with its `presets` merged in, so presets work for every entry point.
 */
function flatten(config: Config): Config {
	if (!config.presets || config.presets.length === 0) return config;
	let output: Config = {};
	merger.merge(output, config);
	return output;
}

/**
 * Build a {@link Message}, or `undefined` when the rule is off.
 * @throws {Error} for a rule that no plugin declares.
 */
function message(
	state: setup.Setup,
	rule: string,
	text: string,
	position?: Position,
): Message | undefined {
	let info = state.rules.get(rule);
	if (!info) throw new Error(`Rule "${rule}" is not declared by any plugin`);
	if (info.state === false) return;

	let output: Message = {
		rule,
		severity: info.state.severity,
		message: detach(text),
	};
	if (position) {
		output.line = position.line;
		output.col = position.column;
	}
	if (info.meta?.docs) output.docs = info.meta.docs;
	return output;
}

function options(state: setup.Setup, rule: string): true | Dict | undefined {
	let info = state.rules.get(rule);
	if (!info) throw new Error(`Rule "${rule}" is not declared by any plugin`);
	return info.state === false ? undefined : info.state.options;
}

/**
 * Run every plugin on one page.
 */
async function inspect(
	html: string,
	state: setup.Setup,
	host: string | undefined,
	url: string | undefined,
): Promise<Result> {
	let document: Document = parse(html);
	let messages: Message[] = [];
	let data = new Map<string, unknown>();

	let context: Context = {
		options: { host },
		url,
		load: (rule) => options(state, rule),
		report(rule, text, node) {
			let position = node ? document.position(node.start) : undefined;
			let found = message(state, rule, text, position);
			if (found) messages.push(found);
		},
		assert(
			rule: string,
			check: boolean | ((options: Dict) => boolean),
			text: string,
			node?: Node,
		) {
			let found = options(state, rule);
			if (found === undefined) return;
			let passed =
				typeof check === "function"
					? check(typeof found === "object" ? found : {})
					: check;
			passed || context.report(rule, text, node);
		},
	};

	for (let plugin of state.plugins) {
		try {
			let value = await plugin.run(context, document);
			if (value !== undefined) data.set(plugin.name, value);
		} catch (err) {
			throw new Error(`Plugin "${plugin.name}" failed`, { cause: err });
		}
	}

	return { messages, data };
}

/**
 * Lint an HTML string with the built-in plugins and any `config.plugins`.
 * Resolves with `undefined` when every rule passes. Rejects when a plugin
 * throws, or when the config names an unknown rule. Checks that span the
 * whole site, such as `site.title.unique`, need `fs()`, `url()`, or `run()`.
 * @param url The page's URL, for rules that compare against it, such as `canonical.href.self`.
 * @example
 * let messages = await lint("<html>...</html>");
 * let custom = await lint("<html>...</html>", await resolve(), "https://example.com/");
 */
export async function lint(
	html: string,
	options: Config = {},
	url?: string,
): Promise<Message[] | undefined> {
	let config = flatten(options);
	let { messages } = await inspect(html, setup.setup(config), config.host, url);
	if (messages.length > 0) return messages;
}

/**
 * Lint an HTML file, or every HTML file inside a directory. A directory is
 * treated as the site root, for site checks such as `site.robots`.
 * @example
 * let report = await fs('public', await resolve());
 */
export async function fs(path: string, options: Config = {}): Promise<Report> {
	let config = flatten(options);
	let single = (await stat(path)).isFile();
	let root = single ? dirname(path) : path;
	let files = await walk(path);
	return collect(
		files.map((file) => local(root, file, config.host)),
		config,
		single ? [] : [root],
	);
}

/**
 * Fetch and lint a URL. Uses its origin as `host` unless one is set.
 * @example
 * let report = await url('https://example.com', await resolve());
 */
export async function url(href: string, options: Config = {}): Promise<Report> {
	let config = flatten(options);
	return collect([remote(href, config.host)], config, []);
}

/**
 * Lint all `config.inputs`, which must be all URLs or all file-system paths.
 * @example
 * let report = await run(await resolve({ inputs: ['public'] }));
 */
export async function run(input: Config = {}, options?: Argv): Promise<Report> {
	let config = flatten(input);
	let cwd = resolve((options && options.cwd) || ".");
	let inputs = config.inputs || [];
	if (inputs.length === 0) throw new Error("Missing inputs to analyze");

	let urls = inputs.filter((x) => HTTP.test(x)).length;

	if (urls && urls !== inputs.length) {
		throw new Error("Inputs cannot contain both file-system and URL targets");
	}

	if (urls) {
		return collect(
			inputs.map((x) => remote(x, config.host)),
			config,
			[],
		);
	}

	let roots: string[] = [];
	let targets = new Map<string, Target>();

	for (let input of inputs) {
		let path = resolve(cwd, input);
		let single = (await stat(path)).isFile();
		let root = single ? dirname(path) : path;
		if (!single) roots.push(root);
		for (let file of await walk(path)) {
			if (!targets.has(file)) targets.set(file, local(root, file, config.host));
		}
	}

	return collect([...targets.values()], config, [...new Set(roots)]);
}

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

function local(root: string, file: string, host: string | undefined): Target {
	return {
		input: file,
		path: relative(root, file).split(sep).join("/"),
		url: address(root, file, host),
		host,
		html: () => readFile(file, "utf8"),
	};
}

function remote(href: string, host: string | undefined): Target {
	return {
		input: href,
		path: new URL(href).pathname.replace(/^\//, ""),
		url: href,
		host: host || new URL(href).origin,
		async html() {
			let res = await fetch(href);
			if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

			let type = res.headers.get("content-type") || "";
			if (!type.includes("text/html")) {
				throw new Error('Invalid "Content-Type" header');
			}

			return res.text();
		},
	};
}

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

/**
 * Lint each target with bounded concurrency, then run each plugin's
 * `finish` step over the pages. Report keys keep the order of `targets`.
 */
async function collect(
	all: Target[],
	config: Config,
	roots: string[],
): Promise<Report> {
	let ignore = (config.ignore ?? []).map(glob.compile);
	let targets = all.filter((x) => !ignore.some((re) => re.test(x.path)));

	let state = setup.setup(config);
	let results: Result[] = [];
	let queue = targets.entries();

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
			for (let [i, target] of queue) {
				try {
					let html = await target.html();
					results[i] = await inspect(html, state, target.host, target.url);
				} catch (err) {
					throw new Error(`Failed to lint "${target.input}"`, { cause: err });
				}
			}
		}),
	);

	let output: Report = {};
	targets.forEach((target, i) => {
		let { messages } = results[i];
		if (messages.length > 0) output[target.input] = messages;
	});

	for (let plugin of state.plugins) {
		if (!plugin.finish) continue;

		let site: Site = {
			options: { host: config.host },
			roots,
			load: (rule) => options(state, rule),
			report(rule, text, input, position) {
				let found = message(state, rule, text, position);
				if (found) (output[input] ||= []).push(found);
			},
		};

		let pages = targets.flatMap((target, i) => {
			let data = results[i].data;
			if (!data.has(plugin.name)) return [];
			return [
				{ input: target.input, url: target.url, data: data.get(plugin.name) },
			];
		});

		try {
			await plugin.finish(site, pages);
		} catch (err) {
			throw new Error(`Plugin "${plugin.name}" failed`, { cause: err });
		}
	}

	return output;
}
