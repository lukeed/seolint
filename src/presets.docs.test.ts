import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import * as presets from "./presets";

const DOCS = await Bun.file(
	join(import.meta.dir, "../www/content/docs/presets.md"),
).text();

/**
 * The text of the docs section for `name`, up to the next heading.
 */
function section(name: string): string {
	let heading = `### \`${name}\`\n`;
	let start = DOCS.indexOf(heading);
	expect(start).not.toBe(-1);
	let end = DOCS.indexOf("\n#", start + heading.length);
	return DOCS.slice(start, end === -1 ? undefined : end);
}

/**
 * The rule names or patterns in the first column of each list item or table row.
 */
function listed(text: string): string[] {
	let rows = text.matchAll(/^(?:- |\| )\[?`"?([\w.*]+)"?(?:": \w+)?`/gm);
	return [...rows].map((x) => x[1]);
}

describe("www/content/docs/presets.md", () => {
	test("lists every rule of strict", () => {
		let rules = Object.keys(presets.strict.rules ?? {});
		expect(listed(section("strict")).sort()).toEqual(rules.sort());
	});

	test("lists every setting of essentials", () => {
		let rules = Object.keys(presets.essentials.rules ?? {});
		expect(listed(section("essentials")).sort()).toEqual(rules.sort());
	});

	test("lists every rule of staging", () => {
		let rules = Object.keys(presets.staging.rules ?? {});
		expect(listed(section("staging")).sort()).toEqual(rules.sort());
	});
});
