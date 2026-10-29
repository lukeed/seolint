const ELEMENTS = new Set(
	[
		"a abbr address area article aside audio b base bdi bdo blockquote body br button",
		"canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt",
		"em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html",
		"i iframe img input ins kbd label legend li link main map mark math menu meta meter nav noscript",
		"object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section",
		"select slot small source span strong style sub summary sup svg table tbody td template textarea",
		"tfoot th thead time title tr track u ul var video wbr",
		"acronym applet basefont bgsound big blink center dir font frame frameset image isindex keygen",
		"listing marquee menuitem multicol nextid nobr noembed noframes param plaintext rb rtc spacer",
		"strike tt xmp",
	]
		.join(" ")
		.split(" "),
);

const TAG = /<\/?([a-z][a-z0-9]*)(?:\s[^<>]*)?\/?>/gi;

/**
 * Whether `text` holds HTML markup: a tag of an HTML element, a comment, or a
 * declaration. Tags that no HTML element has, such as `<my-element>` or
 * `<svelte:head>`, are not markup, so text can name them.
 * @example
 * markup.test("Our <b>best</b> bread"); //=> true
 * markup.test("How <svelte:head> works"); //=> false
 */
export function test(text: string): boolean {
	if (/<[!?]/.test(text)) return true;
	for (let [, name] of text.matchAll(TAG)) {
		if (ELEMENTS.has(name.toLowerCase())) return true;
	}
	return false;
}
