import type { Plugin, Rules } from "./types";

/**
 * Define a plugin. Its `rules` map each rule name to `true`, to `false`
 * for a rule that is off by default, or to the rule's default options; they
 * type the `context` that `run` receives. What `run` returns for each page
 * is passed to the optional `finish` step, which checks the whole site.
 * @example
 * export const lang = plugin({
 * 	name: "lang",
 * 	rules: { "lang.exists": true },
 * 	run(context, document) {
 * 		let html = document.find("html");
 * 		context.assert("lang.exists", Boolean(html?.getAttr("lang")), "Must have a `lang`", html);
 * 	},
 * });
 */
export function plugin<T extends Rules, D = never>(
	definition: Plugin<T, D>,
): Plugin<T, D> {
	return definition;
}
