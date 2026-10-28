import * as config from "seolint/config";
import * as presets from "seolint/presets";

export default config.define({
	host: "https://seolint.dev",
	inputs: ["public"],
	ignore: ["404.html"],
	presets: [presets.strict],
});
