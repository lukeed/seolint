import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import * as plugins from "./index";
import * as about from "./meta";

import type { Meta } from "../types";

const DIR = join(import.meta.dir, "../../www/content/docs/rules");
const INDEX = await Bun.file(join(DIR, "index.md")).text();

/**
 * The frontmatter fields of a docs page.
 */
function frontmatter(text: string): Record<string, string> {
	let block = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
	let output: Record<string, string> = {};
	for (let line of block.split("\n")) {
		let [key, ...rest] = line.split(": ");
		let value = rest.join(": ");
		output[key] = value.startsWith('"') ? JSON.parse(value) : value;
	}
	return output;
}

describe("www/content/docs/rules", () => {
	for (let plugin of plugins.builtins) {
		let meta: Record<string, Meta | undefined> = plugin.meta ?? {};

		test(`${plugin.name} has a section and a table`, () => {
			expect(INDEX).toContain(`\n## ${plugin.name}\n`);
			expect(INDEX).toContain(`<bongo:ruletable plugin="${plugin.name}" />`);
		});

		for (let rule of Object.keys(plugin.rules)) {
			test(rule, async () => {
				let info = meta[rule];
				expect(info?.description).toBeString();
				expect(info?.category).toBeString();
				expect(info?.docs).toBe(about.docs(rule));

				let page = await Bun.file(join(DIR, `${rule}.md`)).text();
				let fields = frontmatter(page);
				expect(fields.title).toBe(rule);
				expect(fields.summary.length).toBeWithin(50, 161);

				let references = page.split("\n## References\n")[1] ?? "";
				expect(references).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\): \S/m);
			});
		}
	}

	test("documents no other rules", async () => {
		let files = (await readdir(DIR)).filter((x) => x !== "index.md");
		let documented = files.map((x) => x.replace(/\.md$/, ""));
		let declared = plugins.builtins.flatMap((x) => Object.keys(x.rules));
		expect(documented.sort()).toEqual(declared.sort());
	});
});
