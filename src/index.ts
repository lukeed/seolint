import { join, resolve } from 'path';
import { parse } from 'node-html-parser';
import { lstat, list, read } from './utils/fs';
import { fetch } from './utils/http';
import { load } from './config';

import type { Argv, Context, Config, Dict } from 'seolint';
import type { Report, Messages } from 'seolint';

export class Assertion extends Error {
	rule: string;
	constructor(message: string, rule: string) {
		super(message);
		this.rule = rule;
	}
}

export async function config(options: Argv = {}): Promise<Config> {
	options.cwd = resolve(options.cwd || '.');

	let value = await load(options.cwd) || {};
	if (options.host) value.host = options.host;
	if (options.input) value.inputs = options.input;

	if (value.host && !/^https?:\/\//.test(value.host)) {
		throw new Error('A `host` value must include "http://" or "https://" protocol');
	}

	return value;
}

export async function lint(html: string, config?: Omit<Config, 'inputs'>): Promise<Messages|void> {
	let { plugins=[], rules={}, ...rest } = config || {};

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
		assert(title: string, check: boolean | ((o: Dict) => boolean), msg: string) {
			let tmp = context.load(title);
			if (tmp === true) tmp = {};
			else if (!tmp) return;

			let bool = typeof check === 'function'
				? check(tmp)
				: check;

			bool || context.report(title, msg);
		}
	};

	for (let fn of plugins) {
		try {
			// @ts-ignore - HTMLElement
			await fn(context, document);
		} catch (err) {
			if (err instanceof Assertion) {
				output[err.rule] = { message: err.message };
				invalid = true;
			} else {
				console.error('ERROR', err.stack);
			}
		}
	}

	if (invalid) return output;
}

export async function fs(path: string, config?: Omit<Config, 'inputs'>): Promise<Report> {
	let output: Report = {};

	let stats = await lstat(path);

	if (stats.isFile()) {
		if (!/\.html?$/.test(path)) return output;
		let data = await read(path, 'utf8');

		return lint(data, config).then(msgs => {
			if (msgs) output[path] = msgs;
			return output;
		});
	}

	let arr = await list(path);

	await Promise.all(
		arr.map(x => {
			let nxt = join(path, x);
			return fs(nxt, config).then(rep => {
				Object.assign(output, rep);
			});
		})
	);

	return output;
}

export async function url(path: string, config?: Omit<Config, 'inputs'>): Promise<Report> {
	let output: Report = {};
	let html = await fetch(path);
	if (!config || !config.host) {
		let host = new URL(path).origin;
		config = { ...config, host };
	}
	let msgs = await lint(html, config);
	if (msgs) output[path] = msgs;
	return output;
}

export async function run(config?: Config, options?: Argv): Promise<Report> {
	let isHTTP=0, HTTP=/^https?:\/\//;
	let cwd = resolve(options && options.cwd || '.');
	let i=0, inputs = ([] as string[]).concat(config && config.inputs || []);
	if (inputs.length === i) throw new Error('Missing inputs to analyze');

	for (; i < inputs.length; i++) {
		if (HTTP.test(inputs[i])) isHTTP++;
		else inputs[i] = join(cwd, inputs[i]);
	}

	if (isHTTP && isHTTP !== inputs.length) {
		throw new Error('Inputs cannot contain both file-system and URL targets');
	}

	let output: Report = {};
	let action = isHTTP ? url : fs;

	await Promise.all(
		inputs.map(input => {
			return action(input, config).then(report => {
				Object.assign(output, report);
			}).catch(err => {
				console.error('ERROR', input, err.stack || err);
			});
		})
	);

	return output;
}
