import { canonical } from "./canonical";
import { description } from "./description";
import { heading } from "./heading";
import { hreflang } from "./hreflang";
import { html } from "./html";
import { image } from "./image";
import { link } from "./link";
import { mixed } from "./mixed";
import { og } from "./og";
import { robots } from "./robots";
import { site } from "./site";
import { title } from "./title";
import { twitter } from "./twitter";
import { viewport } from "./viewport";

export {
	canonical,
	description,
	heading,
	hreflang,
	html,
	image,
	link,
	mixed,
	og,
	robots,
	site,
	title,
	twitter,
	viewport,
};

/** The plugins that always run, in order. */
export const builtins = [
	html,
	title,
	description,
	canonical,
	viewport,
	heading,
	robots,
	image,
	link,
	mixed,
	hreflang,
	og,
	twitter,
	site,
] as const;
