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
	const colors = require('kleur/colors');
	if (flags['--no-color']) colors.$.enabled = false;

	try {
		var options = { host, input };
		var config = await seolint.config(options);
	} catch (err) {
		return console.error('ERROR.CONFIG', err.stack);
	}

	try {
		var report = piped.length
			? await seolint.lint(piped, config).then(m => ({ 'stdin': m }))
			: await seolint.run(config, options);
	} catch (err) {
		process.exitCode = 1;
		return console.log('ERROR', err);
	}

	const SYM = colors.red('  ✘  ');
	const FAIL = colors.bold(colors.bgRed(' FAIL '));
	const FILE = x => colors.bold(' ' + colors.underline(colors.white(x)));

	let total=0, output='';
	let rule, input, errors, wMsg=0;

	for (input in report) {
		errors = report[input];

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
			output += FAIL + FILE(input) + '\n';
			for (rule in errors) {
				output += '  ' + colors.dim(' 9:44') + SYM;
				output += errors[rule].message.padEnd(wMsg, ' ');
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
	return console.log('TODO --help');
}

if (flags['--version'] || flags['-v']) {
	return console.log('seolint, v0.0.0');
}

if (host === true) {
	key = flags['-H'] ? '-H' : '--host';
	return bail(`Missing '${key}' value`);
}

if (quiet && quiet !== true) input.unshift(quiet);

if (key = flags['--input'] || flags['-i']) {
	if (key !== true) input.unshift(key);
	if (isPIPE) return process.stdin.on('data', onpipe).on('end', init);
	return bail(`Must use '-i' or '--input' with stdin pipe`);
}

init();
