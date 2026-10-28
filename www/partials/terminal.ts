type Args = { command: string; lines: string[] };

const ROW = 21;
const FONT = 13;
const CHAR = FONT * 0.6;
const PAD = 22;
const TOP = 48;
const BASE = TOP + 14;
const VISIBLE = 18;
const TYPE = 0.05;
const STEP = 0.07;
const HOLD = 5;

const MESSAGE = /^(\s*)(\d+:\d+)?(\s+)([✘⚠])(\s+)(.*?)(\s{2,})(\S+)$/u;
const HEADER = /^ (FAIL|WARN|PASS)  (.*)$/;

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

function span(text: string, kind?: string): string {
	return kind ? `<tspan class="${kind}">${escape(text)}</tspan>` : escape(text);
}

/**
 * The tspans of one output line, colored like the CLI's pretty format.
 */
function row(line: string, y: number): string {
	let header = line.match(HEADER);
	if (header) {
		let [, label, rest] = header;
		let x = PAD + CHAR;
		let badge = `<rect class="badge ${label.toLowerCase()}" x="${x - 3}" y="${y - FONT + 1}" width="${label.length * CHAR + 6}" height="${FONT + 4}" rx="3"/>`;
		return `${badge}<text x="${PAD}" y="${y}">${escape(" ")}${span(label, "label")}${escape("  ")}${span(rest, "strong")}</text>`;
	}

	let message = line.match(MESSAGE);
	if (message) {
		let [, lead, at = "", gap, symbol, space, text, pad, rule] = message;
		let kind = symbol === "✘" ? "error" : "warn";
		let parts = [
			escape(lead),
			span(at, "dim"),
			escape(gap),
			span(symbol, kind),
			escape(space),
			span(text),
			escape(pad),
			span(rule, "dim"),
		];
		return `<text x="${PAD}" y="${y}">${parts.join("")}</text>`;
	}

	return `<text x="${PAD}" y="${y}">${escape(line)}</text>`;
}

/**
 * An animated terminal that runs `command` and prints `lines`, as an inline SVG.
 * Each line appears in turn, and the view scrolls once it is full, then the loop restarts.
 */
export default function (args: Args): string {
	let width = Math.ceil(
		Math.max(...args.lines.map((x) => x.length), args.command.length + 2) *
			CHAR +
			PAD * 2,
	);
	let height = TOP + VISIBLE * ROW + 14;
	let typed = 0.6 + args.command.length * TYPE;
	let start = typed + 0.5;
	let total = start + args.lines.length * STEP + HOLD;
	let pct = (t: number) => ((t / total) * 100).toFixed(3);

	let keyframes: string[] = [];
	let rows: string[] = [];
	args.lines.forEach((line, i) => {
		let at = start + i * STEP;
		keyframes.push(
			`@keyframes r${i}{0%,${pct(at)}%{opacity:0}${pct(at + 0.001)}%,100%{opacity:1}}`,
		);
		rows.push(
			`<g class="row" style="animation-name:r${i}">${row(line, BASE + (i + 1) * ROW)}</g>`,
		);
	});

	let bottom = height - 12;
	let shift = (i: number) => Math.max(0, BASE + (i + 1) * ROW - bottom);
	let shifts = [`0%{transform:translateY(0)}`];
	args.lines.forEach((_, i) => {
		if (shift(i) === 0) return;
		let at = start + i * STEP;
		shifts.push(
			`${pct(at)}%{transform:translateY(${-shift(i - 1)}px)}${pct(at + 0.001)}%{transform:translateY(${-shift(i)}px)}`,
		);
	});
	shifts.push(`100%{transform:translateY(${-shift(args.lines.length - 1)}px)}`);

	let style = [
		`.term{--d:${total.toFixed(2)}s}`,
		`.term .row,.term .scroll,.term .typed{animation-duration:var(--d);animation-iteration-count:infinite;animation-timing-function:linear}`,
		`.term .typed{animation-name:type;animation-timing-function:steps(${args.command.length})}`,
		`@keyframes type{0%,${pct(0.6)}%{width:0}${pct(typed)}%,100%{width:${(args.command.length * CHAR).toFixed(1)}px}}`,
		`.term .scroll{animation-name:scroll}@keyframes scroll{${shifts.join("")}}`,
		...keyframes,
		`@media (prefers-reduced-motion:reduce){.term .row,.term .scroll,.term .typed{animation:none}}`,
	].join("");

	let commandX = PAD + CHAR * 2;
	return `<svg class="term" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="seolint run on the example site, printing ${args.lines.filter((x) => MESSAGE.test(x)).length} messages">
<style>${style}</style>
<rect class="frame" width="${width}" height="${height}" rx="14"/>
<circle class="dot" cx="${PAD}" cy="20" r="5.5"/><circle class="dot" cx="${PAD + 18}" cy="20" r="5.5"/><circle class="dot" cx="${PAD + 36}" cy="20" r="5.5"/>
<line class="rule" x1="0" x2="${width}" y1="38" y2="38"/>
<clipPath id="term-view"><rect x="0" y="39" width="${width}" height="${height - 39}"/></clipPath>
<clipPath id="term-type"><rect class="typed" x="${commandX}" y="${BASE - FONT - 2}" height="${ROW}" width="${(args.command.length * CHAR).toFixed(1)}"/></clipPath>
<g clip-path="url(#term-view)"><g class="scroll">
<text x="${PAD}" y="${BASE}"><tspan class="prompt">$</tspan></text>
<text x="${commandX}" y="${BASE}" clip-path="url(#term-type)">${escape(args.command)}</text>
${rows.join("\n")}
</g></g>
</svg>`;
}
