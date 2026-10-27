/**
 * Compile a rule pattern, such as `"og.*"`, into a RegExp. `*` matches any
 * characters, including dots.
 * @example
 * compile("og.*").test("og.image.secure"); //=> true
 */
export function compile(input: string): RegExp {
	let escaped = input
		.split("*")
		.map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
	return new RegExp(`^${escaped.join(".*")}$`);
}
