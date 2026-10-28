import { markdown } from "@bongo/markdown";
import { define } from "bongo";
import { createHighlighter } from "shiki";

declare module "bongo" {
	namespace Template {
		interface Site {
			/** The seolint repository, for links in the nav and footer. */
			repo: string;
		}
	}
}

const THEMES = { light: "github-light", dark: "github-dark" };

const shiki = await createHighlighter({
	themes: Object.values(THEMES),
	langs: ["html", "ts", "json", "xml", "sh", "yaml"],
});

/**
 * Highlight a code block in both themes, as CSS variables that the stylesheet picks.
 */
function highlight(code: string, block: { lang: string }): string | undefined {
	if (!shiki.getLoadedLanguages().includes(block.lang)) return;
	return shiki.codeToHtml(code, {
		lang: block.lang,
		themes: THEMES,
		defaultColor: false,
	});
}

export default define({
	$site: {
		title: "seolint",
		description:
			"A robust and configurable SEO linter for the HTML your site generator builds.",
		url: "https://seolint.io/",
		lang: "en",
		repo: "https://github.com/lukeed/seolint",
	},
	plugins: [markdown({ headingIds: true, highlighter: highlight })],
});
