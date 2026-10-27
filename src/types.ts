import type { Document, Node } from "@lukeed/html";

/** Any object with string keys, such as a rule's options. */
export type Dict = Record<string, unknown>;
export type Promisable<T> = Promise<T> | T;

/**
 * A plugin's rules: each rule name maps to `true`, or to the rule's default
 * options. Rule names are usually prefixed with the plugin name.
 * @example
 * let rules = { "og.title": true, "og.image": { secure: false } };
 */
export type Rules = Record<string, boolean | Dict>;

/**
 * How a config sets one rule: `false` turns it off, `true` turns it on with
 * its default options, and an object turns it on and overrides some options.
 * @example
 * let off: Setting = false;
 * let longer: Setting = { max: 70 };
 */
export type Setting = boolean | Dict;

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
	 * The rule's options, `true` for a rule without options, or `undefined` when the rule is off.
	 * @example
	 * let length = context.load("title.content.length"); //=> { min: 10, max: 300 }
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
	 * context.assert("lang.exists", html?.hasAttr("lang") === true, "Must have a `lang`", html);
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

/**
 * A set of related rules and the code that checks them. Create one with
 * `plugin()` from `seolint/config`, which infers `T` from `rules`.
 */
export type Plugin<T extends Rules = Rules> = {
	/** A unique name. A plugin replaces a built-in plugin with the same name. */
	name: string;
	/**
	 * Every rule that the plugin checks, mapped to `true`, or to the rule's
	 * default options. A config can only set the rules listed here, and
	 * `run` can only report them.
	 */
	rules: T;
	/** Check one parsed page. It runs once per page, and may be async. */
	run(context: Context<T>, document: Document): Promisable<void>;
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
	/** Other configs to merge in first. This config's values win. */
	presets?: Config[];
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
	/** What is wrong. */
	message: string;
	/** The 1-based line of the node that failed, when the plugin passed one. */
	line?: number;
	/** The 1-based column of the node that failed, when the plugin passed one. */
	col?: number;
};

/**
 * The failures of each input, by file path or URL. Inputs without failures
 * are left out.
 */
export type Report = {
	[input: string]: Message[];
};
