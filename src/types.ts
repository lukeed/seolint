import type { Document, Node } from "@lukeed/html";

/** Any object with string keys, such as a rule's options. */
export type Dict = Record<string, unknown>;
export type Promisable<T> = Promise<T> | T;

/** How serious a failure is. Only errors make the CLI exit with `1`. */
export type Severity = "error" | "warn";

/**
 * A plugin's rules: each rule name maps to `true`, to `false` for a rule
 * that is off unless a config turns it on, or to the rule's default options.
 * Rule names are usually prefixed with the plugin name.
 * @example
 * let rules = { "og.title": true, "og.image": { secure: false } };
 */
export type Rules = Record<string, boolean | Dict>;

/**
 * How a config sets one rule:
 * - `false` turns it off.
 * - `true` turns it on, with its default severity and options.
 * - `"error"` or `"warn"` turns it on with that severity.
 * - an object turns it on and overrides some of its options.
 * - `[severity, options]` does both.
 * @example
 * let off: Setting = false;
 * let longer: Setting = { max: 70 };
 * let lenient: Setting = ["warn", { max: 70 }];
 */
export type Setting = boolean | Severity | Dict | [Severity, Dict];

/** Facts about one rule, for messages and `seolint --rules`. */
export type Meta = {
	/** One sentence about what the rule checks. */
	description: string;
	/** The severity when a config does not set one. Default: `"error"`. */
	severity?: Severity;
	/** A page that explains the rule. Messages for the rule link to it. */
	docs?: string;
};

/** A 1-based source location. */
export type Position = {
	line: number;
	column: number;
};

/**
 * What a plugin's `run` function uses to read its rules and report failures.
 * `T` is the plugin's {@link Rules}, which types every rule name and option.
 */
export type Context<T extends Rules = Rules> = {
	/** Site settings from the config. */
	readonly options: {
		/** The site URL, such as `https://example.com`, which tells internal links from external ones. */
		host?: string;
	};

	/**
	 * The URL of the page being checked, or `undefined` when it is not known.
	 * For a file, it is the `host` plus the file's path, without `index.html`.
	 * @example
	 * context.url; //=> "https://example.com/blog/launch/"
	 */
	readonly url: string | undefined;

	/**
	 * The rule's options, `true` for a rule without options, or `undefined` when the rule is off.
	 * @example
	 * let length = context.load("title.content.length"); //=> { min: 10, max: 60 }
	 */
	load<K extends keyof T>(rule: K): T[K] | undefined;

	/**
	 * Report a failure for `rule`, unless the config turns it off. Pass the
	 * `node` that failed to include its line and column.
	 * @example
	 * context.report("heading.single", "A page must have only one <h1>", extra);
	 */
	report<K extends keyof T>(rule: K, message: string, node?: Node): void;

	/**
	 * Report a failure for `rule` when `check` is `false`, unless the config
	 * turns the rule off.
	 * @example
	 * context.assert("html.lang", html?.hasAttr("lang") === true, "Must have a `lang`", html);
	 */
	assert<K extends keyof T>(
		rule: K,
		check: boolean,
		message: string,
		node?: Node,
	): void;
	/**
	 * Report a failure for `rule` when `check` returns `false`. The `check`
	 * receives the rule's options, with the config's settings merged over the
	 * defaults. It does not run when the config turns the rule off.
	 * @example
	 * context.assert("link.external.limit", (options) => count <= options.max, "Too many external links");
	 */
	assert<K extends keyof T>(
		rule: K,
		check: (options: Exclude<T[K], boolean>) => boolean,
		message: string,
		node?: Node,
	): void;

	// TODO?: async checks
	// assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => Promise<boolean>, message: string): Promise<void>;
	// assert<K extends keyof T>(title: K, check: boolean | ((options: Exclude<T[K],boolean>) => Promisable<boolean>), message: string): Promisable<void>;
};

/** One page, as a plugin's `finish` step sees it. */
export type Page<D> = {
	/** The file path or URL that was linted. Reports use it as the key. */
	input: string;
	/** The page URL, as in {@link Context.url}. */
	url: string | undefined;
	/** What `run` returned for this page. */
	data: D;
};

/**
 * What a plugin's `finish` step uses to read its rules and report failures
 * after every page was checked.
 */
export type Site<T extends Rules = Rules> = {
	/** Site settings from the config. */
	readonly options: {
		/** The site URL, as in {@link Context.options}. */
		host?: string;
	};

	/** The folders that were linted, as site roots. Empty for URLs and single files. */
	readonly roots: string[];

	/** The rule's options, as in {@link Context.load}. */
	load<K extends keyof T>(rule: K): T[K] | undefined;

	/**
	 * Report a failure for `rule` on `input`, unless the config turns it off.
	 * `input` is a page's input, or the path of another file, such as `robots.txt`.
	 * @example
	 * site.report("site.title.unique", "Must be unique", page.input, page.data.position);
	 */
	report<K extends keyof T>(
		rule: K,
		message: string,
		input: string,
		position?: Position,
	): void;
};

/**
 * A set of related rules and the code that checks them. Create one with
 * `plugin()` from `seolint/config`, which infers `T` from `rules` and `D`
 * from what `run` returns.
 */
export type Plugin<T extends Rules = Rules, D = unknown> = {
	/** A unique name. A plugin replaces a built-in plugin with the same name. */
	name: string;
	/**
	 * Every rule that the plugin checks, mapped to `true`, to `false` for a
	 * rule that is off by default, or to the rule's default options. A config
	 * can only set the rules listed here, and the plugin can only report them.
	 */
	rules: T;
	/** A description, default severity, and docs link for each rule. */
	meta?: { [K in keyof NoInfer<T>]?: Meta };
	/**
	 * Check one parsed page. It runs once per page, and may be async. What it
	 * returns is kept for `finish`.
	 */
	run(context: Context<T>, document: Document): Promisable<D | void>;
	/**
	 * Check the whole site, after `run` saw every page. It receives the pages
	 * for which `run` returned a value. It does not run for `lint()`, which
	 * checks a single page.
	 */
	finish?(site: Site<T>, pages: Page<D>[]): Promisable<void>;
};

/**
 * Options for `resolve()`, usually from the command line. They override the
 * values from the config file.
 */
export type Argv = {
	/** Where to look for a config file, and where `inputs` are relative to. Default: the working directory. */
	cwd?: string;
	/** The site URL. Must start with `http://` or `https://`. */
	host?: string;
	/** Files, folders, or URLs to lint. An empty list keeps the config file's `inputs`. */
	inputs?: string[];
	/** How many threads lint pages. Overrides the config file's `workers`. */
	workers?: number;
};

/**
 * A seolint config, as exported by `seolint.config.ts`. Use `define()` from
 * `seolint/config` to type-check it.
 */
export type Config = {
	/** The site URL, such as `https://example.com`, which tells internal links from external ones. */
	host?: string;
	/** Files, folders, or URLs to lint. Paths are relative to the working directory. They must be all URLs or all paths. */
	inputs?: string[];
	/**
	 * Pages to skip, as glob patterns. A pattern matches the page's path,
	 * relative to the linted folder, or the URL path for URLs. `*` matches
	 * within one folder, `**` across folders, and `?` one character. A
	 * pattern without `/` matches at any depth. Error pages, such as
	 * `404.html`, are always skipped in folders.
	 * @example
	 * let ignore = ["print.html", "drafts/**"];
	 */
	ignore?: string[];
	/** Other configs to merge in first. This config's values win. */
	presets?: readonly Config[];
	/**
	 * How many threads lint pages at once. By default, seolint uses one worker
	 * for about every 8 MB of HTML, up to half the CPU cores, and one thread
	 * for URLs. Custom plugins run in workers only when they come from a
	 * config file; set `1` to lint on one thread.
	 */
	workers?: number;
	/** Plugins to run after the built-in ones. A plugin replaces a built-in plugin with the same name. */
	plugins?: readonly Plugin[];
	/**
	 * Rule settings, by rule name. A pattern with `*`, such as `"link.*"`,
	 * sets every matching rule, before exact names apply. Unknown names are
	 * an error.
	 */
	rules?: Record<string, Setting>;
};

/** One failed check. */
export type Message = {
	/** The rule that failed, such as `title.exists`. */
	rule: string;
	/** How serious the failure is. */
	severity: Severity;
	/** What is wrong. */
	message: string;
	/** The 1-based line of the node that failed, when the plugin passed one. */
	line?: number;
	/** The 1-based column of the node that failed, when the plugin passed one. */
	col?: number;
	/** A page that explains the rule, when the plugin gives one. */
	docs?: string;
};

/**
 * The failures of each input, by file path or URL. Inputs without failures
 * are left out.
 */
export type Report = {
	[input: string]: Message[];
};
