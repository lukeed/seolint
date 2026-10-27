import { canonical } from "./canonical";
import { description } from "./description";
import { image } from "./image";
import { link } from "./link";
import { title } from "./title";
import { viewport } from "./viewport";

export { canonical, description, image, link, title, viewport };

/** The plugins that always run, in order. */
export const builtins = [
	title,
	canonical,
	description,
	viewport,
	image,
	link,
] as const;
