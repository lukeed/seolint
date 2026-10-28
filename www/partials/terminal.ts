type Args = {
	command: string;
	lines: string[];
	/** A shorter output for the narrow terminal, which phones show. */
	phone?: string[];
};

/** A run of text and its color class. */
type Segment = [text: string, kind?: string];

/** One rendered row: its segments, and the label of a badge drawn behind its start. */
type Row = { segments: Segment[]; badge?: string };

/** One line of the CLI output, parsed. */
type Line =
	| { type: "header"; label: string; path: string }
	| { type: "message"; at: string; symbol: string; text: string; rule: string }
	| { type: "text"; text: string };

/** The layout of one terminal: its width in columns, and the rows that it shows at once. */
type Layout = { name: string; columns: number; visible: number; wide: boolean };

const ROW = 21;
const FONT = 13;
const CHAR = FONT * 0.6;
const PAD = 22;
const TOP = 48;
const BASE = TOP + 14;
const TYPE = 0.05;
const STEP = 0.07;
const HOLD = 5;

const MESSAGE = /^\s*(\d+:\d+)?\s+([✘⚠])\s+(.*?)\s{2,}(\S+)$/u;
const HEADER = /^ (FAIL|WARN|PASS)  (.*)$/;

const LAYOUTS: Layout[] = [
	{ name: "wide", columns: 0, visible: 18, wide: true },
	{ name: "narrow", columns: 40, visible: 20, wide: false },
];

/**
 * Escape text for SVG, with non-breaking spaces, since SVG text collapses runs of spaces.
 */
function escape(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/ /g, " ");
}

function parse(line: string): Line {
	let header = line.match(HEADER);
	if (header) return { type: "header", label: header[1], path: header[2] };
	let message = line.match(MESSAGE);
	if (message) {
		let [, at = "", symbol, text, rule] = message;
		return { type: "message", at, symbol, text, rule };
	}
	return { type: "text", text: line };
}

/**
 * Split `text` into lines of at most `width` characters, at spaces when it can.
 */
function wrap(text: string, width: number): string[] {
	let output: string[] = [];
	let line = "";
	for (let word of text.split(" ")) {
		while (word.length > width) {
			if (line) (output.push(line), (line = ""));
			output.push(word.slice(0, width));
			word = word.slice(width);
		}
		if (!line) line = word;
		else if (line.length + 1 + word.length <= width) line += " " + word;
		else (output.push(line), (line = word));
	}
	if (line) output.push(line);
	return output;
}

/**
 * The rows of the output in one layout. The wide layout keeps the CLI's own
 * columns. The narrow one wraps each message after its symbol, and puts the
 * rule and position on a line of their own.
 */
function rows(lines: Line[], layout: Layout): Row[] {
	let at = Math.max(
		...lines.map((x) => (x.type === "message" ? x.at.length : 0)),
	);
	let text = Math.max(
		...lines.map((x) => (x.type === "message" ? x.text.length : 0)),
	);
	let output: Row[] = [];

	for (let line of lines) {
		if (line.type === "text") {
			output.push({ segments: [[line.text]] });
		} else if (line.type === "header") {
			output.push({
				badge: line.label,
				segments: [[" "], [line.label, "label"], ["  "], [line.path, "strong"]],
			});
		} else {
			let kind = line.symbol === "✘" ? "error" : "warn";
			let lead: Segment[] = [
				["  " + line.at.padStart(at), "dim"],
				["  "],
				[line.symbol, kind],
				["  "],
			];
			if (layout.wide) {
				output.push({
					segments: [
						...lead,
						[line.text.padEnd(text)],
						["  "],
						[line.rule, "dim"],
					],
				});
				continue;
			}
			let parts = wrap(line.text, layout.columns - 3);
			output.push({
				segments: [[" "], [line.symbol, kind], [" "], [parts[0]]],
			});
			for (let part of parts.slice(1))
				output.push({ segments: [["   "], [part]] });
			let where = line.at ? `${line.rule} · ${line.at}` : line.rule;
			output.push({ segments: [["   "], [where, "dim"]] });
		}
	}

	return output;
}

function render(row: Row, y: number): string {
	let badge = row.badge
		? `<rect class="badge ${row.badge.toLowerCase()}" x="${PAD + CHAR - 3}" y="${y - FONT + 1}" width="${row.badge.length * CHAR + 6}" height="${FONT + 4}" rx="3"/>`
		: "";
	let text = row.segments
		.map(([value, kind]) =>
			kind ? `<tspan class="${kind}">${escape(value)}</tspan>` : escape(value),
		)
		.join("");
	return `${badge}<text x="${PAD}" y="${y}">${text}</text>`;
}

/**
 * One animated terminal that runs `command` and prints `output`. Each row
 * appears in turn, and the view scrolls once it is full, then the loop restarts.
 */
function terminal(command: string, output: Row[], layout: Layout): string {
	let id = `term-${layout.name}`;
	let length = (row: Row) =>
		row.segments.reduce((sum, [x]) => sum + x.length, 0);
	let columns = Math.max(
		...output.map(length),
		command.length + 2,
		layout.columns,
	);
	let width = Math.ceil(columns * CHAR + PAD * 2);
	let height = TOP + layout.visible * ROW + 14;
	let typed = 0.6 + command.length * TYPE;
	let start = typed + 0.5;
	let total = start + output.length * STEP + HOLD;
	let pct = (t: number) => ((t / total) * 100).toFixed(3);

	let keyframes: string[] = [];
	let shown: string[] = [];
	output.forEach((row, i) => {
		let at = start + i * STEP;
		keyframes.push(
			`@keyframes ${id}-${i}{0%,${pct(at)}%{opacity:0}${pct(at + 0.001)}%,100%{opacity:1}}`,
		);
		shown.push(
			`<g class="row" style="animation-name:${id}-${i}">${render(row, BASE + (i + 1) * ROW)}</g>`,
		);
	});

	let bottom = height - 12;
	let shift = (i: number) => Math.max(0, BASE + (i + 1) * ROW - bottom);
	let shifts = [`0%{transform:translateY(0)}`];
	output.forEach((_, i) => {
		if (shift(i) === 0) return;
		let at = start + i * STEP;
		shifts.push(
			`${pct(at)}%{transform:translateY(${-shift(i - 1)}px)}${pct(at + 0.001)}%{transform:translateY(${-shift(i)}px)}`,
		);
	});
	shifts.push(`100%{transform:translateY(${-shift(output.length - 1)}px)}`);

	let style = [
		`#${id}{--d:${total.toFixed(2)}s}`,
		`#${id} .row,#${id} .scroll,#${id} .typed{animation-duration:var(--d);animation-iteration-count:infinite;animation-timing-function:linear}`,
		`#${id} .typed{animation-name:${id}-type;animation-timing-function:steps(${command.length})}`,
		`@keyframes ${id}-type{0%,${pct(0.6)}%{width:0}${pct(typed)}%,100%{width:${(command.length * CHAR).toFixed(1)}px}}`,
		`#${id} .scroll{animation-name:${id}-scroll}@keyframes ${id}-scroll{${shifts.join("")}}`,
		...keyframes,
		`@media (prefers-reduced-motion:reduce){#${id} .row,#${id} .scroll,#${id} .typed{animation:none}}`,
	].join("");

	let x = PAD + CHAR * 2;
	return `<svg id="${id}" class="term ${layout.name}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
<style>${style}</style>
<rect class="frame" width="${width}" height="${height}" rx="14"/>
<circle class="dot" cx="${PAD}" cy="20" r="5.5"/><circle class="dot" cx="${PAD + 18}" cy="20" r="5.5"/><circle class="dot" cx="${PAD + 36}" cy="20" r="5.5"/>
<line class="rule" x1="0" x2="${width}" y1="38" y2="38"/>
<clipPath id="${id}-view"><rect x="0" y="39" width="${width}" height="${height - 39}"/></clipPath>
<clipPath id="${id}-cmd"><rect class="typed" x="${x}" y="${BASE - FONT - 2}" height="${ROW}" width="${(command.length * CHAR).toFixed(1)}"/></clipPath>
<g clip-path="url(#${id}-view)"><g class="scroll">
<text x="${PAD}" y="${BASE}"><tspan class="prompt">$</tspan></text>
<text x="${x}" y="${BASE}" clip-path="url(#${id}-cmd)">${escape(command)}</text>
${shown.join("\n")}
</g></g>
</svg>`;
}

/**
 * The real CLI output as animated terminals: a wide one, and a narrow one for
 * phones, which the stylesheet picks between.
 */
export default function (args: Args): string {
	let lines = args.lines.map(parse);
	let phone = (args.phone ?? args.lines).map(parse);
	let count = lines.filter((x) => x.type === "message").length;
	let svgs = LAYOUTS.map((layout) =>
		terminal(args.command, rows(layout.wide ? lines : phone, layout), layout),
	);
	return `<div class="terminal" role="img" aria-label="seolint run on the example site, printing ${count} messages">${svgs.join("")}</div>`;
}
