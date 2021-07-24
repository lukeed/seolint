export type Toggle =
	| 'off' | 'warn' | 'error'
	| 0 | 1 | 2;

type Dict = Record<string, any>;
export type Rule<T extends Dict = Dict> = Toggle | [Toggle, T];
export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: Rule<T[K]>;
};

export type Severity = 'warn' | 'error';

// export type Check

export interface Message {
	level: Severity;
	message: string;
	line?: number;
	col?: number;
}

export type Messages = {
	[rule: string]: Message;
}

export type Report = {
	[input: string]: Messages;
}

export type Plugin<
	O extends Dict = Dict,
	T extends Dict = Dict,
> = (options?: O) => {
	rules: Rules<T>,
	// checks: Check<T>,
};

export interface Config {
	host?: string;
	inputs?: string[];
	// output?: {
	// 	quiet?: boolean;
	// 	colors?: boolean;
	// 	loglevel?: Severity;
	// };
	// presets?: Rule[];
	plugins?: Plugin[];
	rules?: Rules;
}

export interface Argv {
	cwd?: string;
	host?: string;
	input?: string[];
	// pipe?: string;
	// log?: Severity;
	// quiet?: boolean;
}

// export function file(): Promise<Messages>;
// export function http(): Promise<Messages>;

export function config(options?: Argv): Promise<Config>;
export function lint(html: string, config: Config): Promise<Messages>;
export function run(config: Config, options: Argv): Promise<Report>;
