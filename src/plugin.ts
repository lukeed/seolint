import type { Plugin, Rules } from "./types";

/**
 * Define a plugin. Its `rules` map each rule name to `true`, or to the rule's
 * default options, and type the `context` that `run` receives.
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
export function plugin<T extends Rules>(definition: Plugin<T>): Plugin<T> {
	return definition;
}
