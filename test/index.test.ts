import { suite } from 'uvu';
import { resolve } from 'path';
import * as assert from 'uvu/assert';
import * as seolint from '../src/index';

const fixtures = resolve(__dirname, 'fixtures');

// ---

const config = suite('config()');

config('should be a function', () => {
	assert.type(seolint.config, 'function');
});

config('should resolve with `Config` defaults', async () => {
	let output = await seolint.config();

	// defaults
	assert.is(output.host, '');
	assert.instance(output.inputs, Array);
	assert.is(output.inputs.length, 0);
	assert.instance(output.plugins, Array);
	assert.is(output.plugins.length > 0, true);
	assert.equal(output.rules, {});
});

config('should accept `input` option', async () => {
	let output = await seolint.config({
		input: ['foo', 'bar']
	});

	assert.equal(output.inputs, ['foo', 'bar']);
});

config('should accept `host` option :: valid', async () => {
	let output = await seolint.config({
		host: 'https://foobar.com'
	});

	assert.is(output.host, 'https://foobar.com');
});

config('should accept `host` option :: invalid', async () => {
	try {
		await seolint.config({ host: 'foobar.com' });
		assert.unreachable('should have thrown');
	} catch (err) {
		assert.instance(err, Error);
		assert.is(err.message, 'A `host` value must include "http://" or "https://" protocol');
	}
});

config('should accept custom `cwd` option', async () => {
	let output = await seolint.config({ cwd: fixtures });

	assert.is(output.host, 'https://hello.com');

	assert.equal(output.inputs, [
		'https://hello.com/world/'
	]);

	assert.equal(output.rules, {
		'canonical.href.match': false,
	});
});

config('should always prefer `input` and `host` over config file', async () => {
	let output = await seolint.config({
		cwd: fixtures,
		host: 'https://x.com',
		input: ['public'],
	});

	assert.is.not(output.host, 'https://hello.com');
	assert.is(output.host, 'https://x.com');

	assert.equal(output.inputs, ['public']);

	// still loaded config file
	assert.equal(output.rules, {
		'canonical.href.match': false,
	});
});

config.run();
