import { parse } from 'node-html-parser';
import { join, relative, resolve } from 'path';
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

	return value;
}

export async function lint(html: string, config: Omit<Config, 'inputs'>): Promise<Messages> {
	let document = parse(html);

	let output: Messages = {};
	let rules = config.rules || {};
	let plugins = config.plugins || [];

	let context: Context = {
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
			} else {
				console.error('ERROR', err.stack);
			}
		}
	}

	return output;
}

export async function fs(path: string, config: Omit<Config, 'inputs'>): Promise<Report> {
	let output: Report = {};

	let stats = await lstat(path);

	if (stats.isFile()) {
		if (!/\.html?$/.test(path)) return output;
		let data = await read(path, 'utf8');

		return lint(data, config).then(msgs => {
			output[path] = msgs;
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

export async function url(path: string, config: Omit<Config, 'inputs'>): Promise<Report> {
	let output: Report = {};
	let html = await fetch(path);
	output[path] = await lint(html, config);
	return output;
}

export async function run(config: Config, options: Argv): Promise<Report> {
	let output: Report = {};
	let isHTTP=0, HTTP=/^https?:\/\//;
	let cwd = options.cwd = resolve(options.cwd || '.');
	let i=0, inputs = ([] as string[]).concat(config.inputs || []);
	if (inputs.length === i) throw new Error('Missing inputs to analyze');

	for (; i < inputs.length; i++) {
		if (HTTP.test(inputs[i])) isHTTP++;
		else inputs[i] = join(cwd, inputs[i]);
	}

	if (isHTTP && isHTTP !== inputs.length) {
		throw new Error('Inputs cannot contain both file-system and URL targets');
	}

	let action = isHTTP ? url : fs;

	await Promise.all(
		inputs.map(input => {
			return action(input, config).then(report => {
				if (isHTTP) Object.assign(output, report);
				else for (let key in report) {
					output[relative(cwd, key)] = report[key];
				}
			}).catch(err => {
				console.error('ERROR', input, err.stack || err);
			});
		})
	);

	return output;
}
