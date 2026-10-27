import { readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import * as glob from "./glob";
import { inspect, message, options } from "./inspect";
import * as merger from "./merge";
import * as setup from "./setup";
import { local, read, remote } from "./target";

import type { Result } from "./inspect";
import type { Target } from "./target";
import type { Argv, Config, Message, Report, Site } from "./types";

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
 * Lint each target on this thread, reading up to {@link CONCURRENCY} at once.
 */
async function serial(
	targets: Target[],
	state: setup.Setup,
): Promise<Result[]> {
	let results: Result[] = [];
	let queue = targets.entries();

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
			for (let [i, target] of queue) {
				try {
					let html = await read(target);
					results[i] = await inspect(html, state, target.host, target.url);
				} catch (err) {
					throw new Error(`Failed to lint "${target.input}"`, { cause: err });
				}
			}
		}),
	);

	return results;
}

/**
 * Lint each target, then run each plugin's
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
	let results = await serial(targets, state);

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
