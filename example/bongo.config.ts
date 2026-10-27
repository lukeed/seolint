import { define } from "bongo";
import { markdown } from "@bongo/markdown";

export default define({
	$site: {
		title: "Bongo Bakery",
		url: "https://example.com/",
		lang: "en",
	},
	plugins: [markdown()],
});
