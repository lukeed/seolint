import * as config from "seolint/config";
import * as presets from "seolint/presets";

export default config.define({
	host: "https://seolint.io",
	inputs: ["public"],
	ignore: [
		"404.html",
		// these pages name the rules, so their titles include the words
		"docs/rules/*.content.null/**",
		"docs/rules/*.content.undefined/**",
	],
	presets: [presets.strict],
});
