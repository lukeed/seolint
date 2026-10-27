import { lstat, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse } from "node-html-parser";
import * as conf from "./config";

import type { Argv, Context, Config, Report, Messages } from "./types";

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

/**
 * A failed rule check, thrown by `context.report` and collected by `lint`.
 * @example
 * throw new Assertion('Must have a title', 'title.exists');
 */
export class Assertion extends Error {
	rule: string;
	constructor(message: string, rule: string) {
		super(message);
		this.rule = rule;
	}
}

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

	if (value.host && !/^https?:\/\//.test(value.host)) {
		throw new Error(
			'A `host` value must include "http://" or "https://" protocol',
		);
	}

	return value;
}

/**
 * Lint an HTML string. Resolves with `undefined` when every rule passes.
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

	let context: Context = {
		get options() {
			return rest;
		},
		load(title) {
			let tmp = rules[title];
			return tmp == null || tmp;
		},
		report(title, message) {
			throw new Assertion(message, title);
		},
		assert(
			title: string,
			check: boolean | ((o: object) => boolean),
			msg: string,
		) {
			let tmp = context.load(title);
			if (!tmp) return;

			let bool =
				typeof check === "function"
					? check(typeof tmp === "object" ? tmp : {})
					: check;

			bool || context.report(title, msg);
		},
	};

	for (let fn of plugins) {
		try {
			await fn(context as Context<never>, document);
		} catch (err) {
			if (err instanceof Assertion) {
				output[err.rule] = { message: err.message };
				invalid = true;
			} else {
				console.error("ERROR", (err as Error).stack || err);
			}
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
	let output: Report = {};

	let stats = await lstat(path);

	if (stats.isFile()) {
		if (!/\.html?$/.test(path)) return output;
		let data = await readFile(path, "utf8");

		let msgs = await lint(data, config);
		if (msgs) output[path] = msgs;
		return output;
	}

	let arr = await readdir(path);

	await Promise.all(
		arr.map(async (x) => {
			let rep = await fs(join(path, x), config);
			Object.assign(output, rep);
		}),
	);

	return output;
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
	let output: Report = {};

	let res = await fetch(href);
	if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

	let type = res.headers.get("content-type") || "";
	if (!type.includes("text/html"))
		throw new Error('Invalid "Content-Type" header');

	if (!config || !config.host) {
		let host = new URL(href).origin;
		config = { ...config, host };
	}

	let msgs = await lint(await res.text(), config);
	if (msgs) output[href] = msgs;
	return output;
}

/**
 * Lint all `config.inputs`, which must be all URLs or all file-system paths.
 * @example
 * let report = await run(await config({ input: ['public'] }));
 */
export async function run(config?: Config, options?: Argv): Promise<Report> {
	let HTTP = /^https?:\/\//;
	let cwd = resolve((options && options.cwd) || ".");
	let inputs = (config && config.inputs) || [];
	if (inputs.length === 0) throw new Error("Missing inputs to analyze");

	let isHTTP = inputs.filter((x) => HTTP.test(x)).length;

	if (isHTTP && isHTTP !== inputs.length) {
		throw new Error("Inputs cannot contain both file-system and URL targets");
	}

	let targets = isHTTP ? inputs : inputs.map((x) => join(cwd, x));

	let output: Report = {};
	let action = isHTTP ? url : fs;

	await Promise.all(
		targets.map(async (input) => {
			try {
				Object.assign(output, await action(input, config));
			} catch (err) {
				console.error("ERROR", input, (err as Error).stack || err);
			}
		}),
	);

	return output;
}
