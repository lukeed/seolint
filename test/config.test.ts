import { suite } from 'uvu';
import { resolve } from 'path';
import * as assert from 'uvu/assert';
import * as config from '../src/config';

import type { Config } from '../index';

const fixtures = resolve(__dirname, 'fixtures');

// ---

const find = suite('find()');

find('should be a function', () => {
	assert.type(config.find, 'function');
});

find('should return `void` if file not found', async () => {
	let output = await config.find(__dirname, __dirname);
	assert.is(output, undefined);
});

find('should return `string` if file found', async () => {
	let output = await config.find(__dirname, fixtures);
	assert.is(output, resolve(fixtures, 'seolint.config.mjs'));
});

find.run();

// ---

const load = suite('load()');

load('should be a function', () => {
	assert.type(config.load, 'function');
});

load('should always return `Config` object', async () => {
	let output = await config.load(__dirname);
	assert.type(output, 'object');

	// defaults
	assert.is(output.host, '');
	assert.instance(output.inputs, Array);
	assert.is(output.inputs.length, 0);
	assert.instance(output.plugins, Array);
	assert.is(output.plugins.length > 0, true);
	assert.equal(output.rules, {});
});

load('should merge `Config` from loaded config file', async () => {
	let output = await config.load(fixtures);

	assert.is(output.host, 'https://hello.com');
	assert.equal(output.inputs, [
		'https://hello.com/world/'
	]);
	assert.equal(output.rules, {
		'canonical.href.match': false,
	});
});

load.run();

// ---

const merge = suite('merge()');

merge('should be a function', () => {
	assert.type(config.merge, 'function');
});

merge('should merge two `Config` objects together', () => {
	let input: Config = {
		host: '',
		inputs: [],
		presets: [],
		plugins: [],
		rules: {}
	};

	let next: Config = {
		host: 'https://x.com',
		inputs: ['foobar'],
		rules: {
			'a.b': 123,
			'a.c': 456,
		}
	};

	let before = JSON.stringify(input);
	let output = config.merge(input, next);
	let after = JSON.stringify(input);

	assert.is(output, undefined);
	assert.not.equal(input, next);
	assert.is.not(before, after); // mutated

	assert.equal(input, {
		host: 'https://x.com',
		inputs: ['foobar'],
		presets: [],
		plugins: [],
		rules: {
			'a.b': 123,
			'a.c': 456,
		}
	});
});

merge('should concatenate `plugins` arrays', () => {
	let input: Config = {
		plugins: [
			// @ts-ignore
			'plugin1', 'plugin2',
		]
	};

	let next: Config = {
		plugins: [
			// @ts-ignore
			'next1', 'next2'
		]
	};

	config.merge(input, next);
	assert.equal(input.plugins, ['plugin1', 'plugin2', 'next1', 'next2']);
});

merge('should override `inputs` arrays', () => {
	let input: Config = {
		inputs: ['foo1', 'foo2']
	};

	let next: Config = {
		inputs: ['next1', 'next2']
	};

	config.merge(input, next);
	assert.equal(input.inputs, ['next1', 'next2']);
});

merge('should merge `rules` objects', () => {
	let input: Config = {
		rules: {
			foo: 1,
			bar: 2
		}
	};

	let next: Config = {
		rules: {
			bar: 123,
			baz: 456,
		}
	};

	config.merge(input, next);
	assert.equal(input.rules, {
		foo: 1,
		bar: 123,
		baz: 456
	});
});

merge('should merge `presets` recursively', () => {
	let input: Config = {
		host: '',
		inputs: [],
		plugins: [],
		rules: {},
	};

	// preset #2
	let bar: Config = {
		host: 'https://bar.com',
		inputs: ['bar-dir'],
		plugins: [
			// @ts-ignore
			'bar1', 'bar2',
		],
		rules: {
			'bar.1': true,
			'bar.2': true,
		}
	};

	// preset #1
	let foo: Config = {
		host: 'https://foo.com',
		inputs: ['foo-dir'],
		plugins: [
			// @ts-ignore
			'foo1', 'foo2',
		],
		presets: [
			bar,
		],
		rules: {
			'foo.1': true,
			'foo.2': true,
		}
	};

	let custom: Config = {
		host: 'https://hello.com',
		inputs: ['public', 'examples'],
		plugins: [
			// @ts-ignore
			'custom1', 'custom2',
		],
		presets: [
			foo,
		],
		rules: {
			'foo.1': false,
			'bar.2': false,
			'hello': 123,
		}
	};

	config.merge(input, custom);

	assert.equal(input, {
		host: 'https://hello.com',
		inputs: ['public', 'examples'],
		// @ts-ignore
		plugins: [
			'bar1', 'bar2', 'foo1', 'foo2',
			'custom1', 'custom2'
		],
		rules: {
			'bar.1': true,
			'bar.2': false,
			'foo.1': false,
			'foo.2': true,
			'hello': 123,
		}
	});
});

merge.run();
