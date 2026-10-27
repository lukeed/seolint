/**
 * Compile a glob into a RegExp that matches a whole `/`-separated path.
 * `**` matches any number of folders, `*` matches within one folder, and
 * `?` matches one character. A pattern without `/` matches at any depth.
 * @example
 * compile("drafts/**").test("drafts/a/b.html"); //=> true
 * compile("404.html").test("fr/404.html"); //=> true
 */
export function compile(pattern: string): RegExp {
	let input = pattern.replace(/^\.?\//, "");
	if (!input.includes("/")) input = "**/" + input;

	let output = "";
	for (let i = 0; i < input.length; i++) {
		let c = input[i];
		if (c === "*" && input[i + 1] === "*") {
			let slash = input[i + 2] === "/";
			output += slash ? "(?:.*/)?" : ".*";
			i += slash ? 2 : 1;
		} else if (c === "*") {
			output += "[^/]*";
		} else if (c === "?") {
			output += "[^/]";
		} else {
			output += c.replace(/[.+^${}()|[\]\\]/, "\\$&");
		}
	}

	return new RegExp(`^${output}$`);
}
