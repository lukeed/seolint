#!/usr/bin/env node
const argv = process.argv.slice(2);
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
let quiet = flags['--quiet'] || flags['-q'];
let json = flags['--json'] || flags['-j'];

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
		var options = { host, input };
		var config = await seolint.config(options);
	} catch (err) {
		return bail(err.stack || err);
	}

	try {
		var report = piped.length === 0
			? await seolint.run(config, options)
			: await seolint.lint(piped, config).then(m => {
					return m ? { stdin: m } : {};
				});
	} catch (err) {
		return bail(err.stack || err);
	}

	if (quiet) {
		let item, _;
		for (item in report)
			for (_ in report[item])
				return process.exit(1);
		return process.exit(0);
	}

	if (json) {
		// TODO: remove "message" keys?
		console.log(JSON.stringify(report));
		return process.exit(0);
	}

	const colors = require('kleur/colors');
	if (flags['--no-color']) colors.$.enabled = false;

	const SYM = colors.red('  ✘  ');
	const FAIL = colors.bold(colors.bgRed(' FAIL '));
	const FILE = x => colors.bold(' ' + colors.underline(colors.white(x)));

	let total=0, output='';
	let rule, item, errors, wMsg=0;

	for (item in report) {
		errors = report[item];

		// reset per entry
		output = '\n';
		wMsg = 0;

		// get widths first
		for (rule in errors) {
			total++;
			// TODO: col:row
			wMsg = Math.max(wMsg, errors[rule].message.length);
		}

		if (total > 0) {
			output += FAIL + FILE(item) + '\n';
			for (rule in errors) {
				// output += '  ' + colors.dim(' 9:44') + SYM;
				output += '  ' + SYM + errors[rule].message.padEnd(wMsg, ' ');
				output += '  ' + colors.dim(rule) + '\n';
			}
			process.stderr.write(output);
		}
	}

	if (total > 0) {
		output = '\n' + FAIL + ' Reported ' + colors.red(total) + ' error';
		if (total !== 1) output += 's';
		console.error(output + '!\n');
		process.exitCode = 1;
	} else {
		output = '\n' + colors.bold(colors.green(' PASS '));
		output += ' Looks great! 🎉\n'
		console.log(output);
	}
}

if (flags['--help'] || flags['-h']) {
	let msg = '';
	msg += '\n  Usage';
	msg += '\n    $ seolint [inputs] [options]\n';
	msg += '\n  Options';
	msg += '\n    -i, --input    Accept HTML via stdin pipe';
	msg += '\n    -H, --host     Specify the target hostname';
	msg += '\n    -j, --json     Print JSON output to console';
	msg += '\n    -q, --quiet    Disable terminal reporting';
	msg += '\n    -v, --version  Displays current version';
	msg += '\n    -h, --help     Displays this message\n';
	msg += '\n  Examples';
	msg += '\n    $ seolint public';
	msg += '\n    $ seolint public/index.html';
	msg += '\n    $ seolint dir1 dir2 dir3/file.html';
	msg += '\n    $ seolint https://example.com https://google.com';
	msg += '\n    $ curl -s https://example.com | seolint -i';
	msg += '\n    $ find public -type f -exec seolint {} +\n';
	return console.log(msg);
}

if (flags['--version'] || flags['-v']) {
	return console.log('seolint, v0.0.0');
}

if (host === true) {
	key = flags['-H'] ? '-H' : '--host';
	return bail(`Missing '${key}' value`);
}

if (quiet && quiet !== true) input.unshift(quiet);
if (json && json !== true) input.unshift(json);

if (key = flags['--input'] || flags['-i']) {
	if (key !== true) input.unshift(key);
	if (isPIPE) return process.stdin.on('data', onpipe).on('end', init);
	return bail(`Must use '-i' or '--input' with stdin pipe`);
}

init();
