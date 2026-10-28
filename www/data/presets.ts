import * as presets from "../../src/presets.ts";

/** The rule settings of each built-in preset, from the code. */
export default {
	strict: Object.keys(presets.strict.rules ?? {}),
	essentials: Object.keys(presets.essentials.rules ?? {}),
	staging: Object.keys(presets.staging.rules ?? {}),
};
