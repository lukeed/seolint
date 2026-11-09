import type { Category, Meta, Severity } from "../types";

const DOCS = "https://seolint.io/docs/rules/";

/**
 * The link to a built-in rule's page on seolint.io.
 * @example
 * docs("title.exists"); //=> "https://seolint.io/docs/rules/title.exists/"
 */
export function docs(rule: string): string {
	return `${DOCS}${rule}/`;
}

/**
 * Build the `meta` of built-in rules in one `category`: each rule maps to
 * its description, to `[severity, description]` when it does not default to
 * `"error"`, or to `[severity, description, "off"]` when it is off by default.
 * @example
 * meta("social", { "og.title": ["warn", "A page has an og:title."] });
 */
export function meta(
	category: Category,
	rules: Record<
		string,
		string | [Severity, string] | [Severity, string, "off"]
	>,
): Record<string, Meta> {
	let output: Record<string, Meta> = {};
	for (let [rule, value] of Object.entries(rules)) {
		let [severity, description, off] =
			typeof value === "string" ? [undefined, value, undefined] : value;
		output[rule] = {
			description,
			category,
			docs: docs(rule),
			...(severity && { severity }),
			...(off && { off: true }),
		};
	}
	return output;
}
