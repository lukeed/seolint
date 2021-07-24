// @ts-check
const argv = process.argv.slice(2);
const { NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env;
const isPIPE = !process.stdin.isTTY;

let i=0, key='';
let input=[], flags={};
for (; i <= argv.length; i++) {
	if (i === argv.length) {
		if (key) flags[key] = true;
	} else if (argv[i].charCodeAt(0) === 45) {
		if (key) flags[key] = true;
		key = argv[i];
	} else {
		if (key) flags[key] = argv[i];
		else input.push(argv[i]);
		key = '';
	}
}

let host = flags['--host'] || flags['-H'];
let loglevel = flags['--loglevel'] || flags['-l'];

let options = { host, input };
let quiet = flags['--quiet'] || flags['-q'];

let colors = !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== 'dumb' && !flags['--no-color'];

function bail(message, code = 1) {
	process.exitCode = code;
	console.error(message);
}

let piped = '';
function onpipe(chunk) {
	piped += chunk;
}

async function init() {
	const seolint = require('.');

	try {
		var config = await seolint.config(options);
	} catch (err) {
		return console.error('ERROR.CONFIG', err.stack);
	}

	try {
		var report = piped.length
			? await seolint.lint(piped, config)
			: await seolint.run(config, options);
	} catch (err) {
		return console.log('ERROR', err);
	}

	console.log("OK", report);
}

if (flags['--help'] || flags['-h']) {
	return console.log('TODO --help');
}

if (flags['--version'] || flags['-v']) {
	return console.log('TODO --version');
}

if (host === true) {
	key = flags['-H'] ? '-H' : '--host';
	return bail(`Missing '${key}' value`);
}

if (loglevel === 'warn') loglevel = 1;
else if (loglevel === 'error') loglevel = 2;
else if (loglevel) {
	key = flags['--loglevel'] ? '--loglevel' : '-l';
	if (loglevel === true) return bail(`Missing '${key}' value`);
	else return bail(`Invalid '${key}' value`);
}

if (quiet) loglevel = 0;
if (quiet && quiet !== true) input.unshift(quiet);

if (key = flags['--input'] || flags['-i']) {
	if (key !== true) input.unshift(key);
	if (isPIPE) return process.stdin.on('data', onpipe).on('end', init);
	return bail(`Must use '-i' or '--input' with stdin pipe`);
}

init();
