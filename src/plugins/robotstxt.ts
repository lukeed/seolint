type Rule = {
	allow: boolean;
	path: string;
};

type Group = {
	/** The user agents of the group, in lowercase. */
	agents: string[];
	rules: Rule[];
};

/** A parsed robots.txt. */
export type Robots = {
	groups: Group[];
	/** The URLs of its `Sitemap:` lines. */
	sitemaps: string[];
};

/**
 * Parse a robots.txt, as Google reads it: consecutive `User-agent:` lines
 * share one group, rules before any `User-agent:` line are ignored, and
 * `Sitemap:` lines belong to no group.
 * @example
 * robotstxt.parse("User-agent: *\nDisallow: /admin/\nSitemap: https://example.com/sitemap.xml");
 * //=> { groups: [{ agents: ["*"], rules: [{ allow: false, path: "/admin/" }] }], sitemaps: ["https://example.com/sitemap.xml"] }
 */
export function parse(text: string): Robots {
	let groups: Group[] = [];
	let sitemaps: string[] = [];
	let current: Group | undefined;
	let open = false;

	for (let raw of text.split(/\r?\n/)) {
		let line = raw.replace(/#.*$/, "").trim();
		let index = line.indexOf(":");
		if (index === -1) continue;

		let key = line.slice(0, index).trim().toLowerCase();
		let value = line.slice(index + 1).trim();

		if (key === "sitemap") {
			if (value) sitemaps.push(value);
		} else if (key === "user-agent") {
			if (!open || !current) {
				current = { agents: [], rules: [] };
				groups.push(current);
			}
			current.agents.push(value.toLowerCase());
			open = true;
		} else if (key === "allow" || key === "disallow") {
			open = false;
			if (current && value) {
				current.rules.push({ allow: key === "allow", path: value });
			}
		}
	}

	return { groups, sitemaps };
}

/**
 * Whether a robots.txt `pattern` matches the URL `path`, where `*` matches
 * any characters, and a final `$` matches the end of the path.
 */
function matches(pattern: string, path: string): boolean {
	let end = pattern.endsWith("$");
	let source = (end ? pattern.slice(0, -1) : pattern)
		.split("*")
		.map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
		.join(".*");
	return new RegExp(`^${source}${end ? "$" : ""}`).test(path);
}

/**
 * Whether `robots` lets the crawler `agent` fetch `path`. The groups that
 * name the agent apply, or else the `*` groups. The longest matching rule
 * wins, and `Allow` wins a tie.
 * @example
 * let robots = robotstxt.parse("User-agent: *\nDisallow: /\nAllow: /blog/");
 * robotstxt.allowed(robots, "googlebot", "/blog/a/"); //=> true
 * robotstxt.allowed(robots, "googlebot", "/about/"); //=> false
 */
export function allowed(robots: Robots, agent: string, path: string): boolean {
	let name = agent.toLowerCase();
	let named = robots.groups.filter((x) => x.agents.includes(name));
	let groups = named.length
		? named
		: robots.groups.filter((x) => x.agents.includes("*"));

	let best: Rule | undefined;
	for (let rule of groups.flatMap((x) => x.rules)) {
		if (!matches(rule.path, path)) continue;
		if (
			!best ||
			rule.path.length > best.path.length ||
			(rule.path.length === best.path.length && rule.allow)
		) {
			best = rule;
		}
	}

	return !best || best.allow;
}
