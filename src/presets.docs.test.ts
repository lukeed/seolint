import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import * as presets from "./presets";

const DIR = join(import.meta.dir, "../www/content/docs/presets");

/**
 * The rule names, patterns, or categories in the first column of each table row.
 */
async function listed(name: string): Promise<string[]> {
	let text = await Bun.file(join(DIR, `${name}.md`)).text();
	let rows = text.matchAll(/^\| \[?`"?([\w.*#]+)"?(?:": \w+)?`/gm);
	return [...rows].map((x) => x[1]).sort();
}

describe("www/content/docs/presets", () => {
	test("strict lists its rules from the code", async () => {
		let text = await Bun.file(join(DIR, "strict.md")).text();
		expect(text).toContain('<bongo:presetrules preset="strict" />');
	});

	test("lists every setting of essentials", async () => {
		let rules = Object.keys(presets.essentials.rules ?? {});
		expect(await listed("essentials")).toEqual(rules.sort());
	});

	test("lists every rule of staging", async () => {
		let rules = Object.keys(presets.staging.rules ?? {});
		expect(await listed("staging")).toEqual(rules.sort());
	});
});
