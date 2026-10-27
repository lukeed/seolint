import { markdown } from "@bongo/markdown";

export default {
	$site: {
		title: "Bongo Bakery",
		url: "https://example.com/",
		lang: "en",
	},
	plugins: [markdown()],
};
