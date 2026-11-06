import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "seolint-www",
		compatibilityDate: "2026-10-27",
		assets: {
			htmlHandling: "auto-trailing-slash",
			notFoundHandling: "404-page",
		},
		domains: [
			"seolint.io",
		],
	},
});
