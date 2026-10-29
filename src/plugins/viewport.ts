import { plugin } from "../plugin";
import * as about from "./meta";

export const viewport = plugin({
	name: "viewport",
	rules: {
		"viewport.exists": true,
		"viewport.single": true,
		"viewport.content.empty": true,
		"viewport.content.device": true,
		"viewport.content.scale": true,
		"viewport.content.zoom": true,
	},
	meta: about.meta({
		"viewport.exists": 'A page has a <meta name="viewport"> tag.',
		"viewport.single": "A page has only one viewport tag.",
		"viewport.content.empty": "The viewport content is not empty.",
		"viewport.content.device":
			'The viewport content includes "width=device-width".',
		"viewport.content.scale":
			'The viewport content includes "initial-scale=1".',
		"viewport.content.zoom": "The viewport does not stop users from zooming.",
	}),
	run(context, document) {
		let [elem, ...rest] = document.all("meta[name=viewport]");

		context.assert(
			"viewport.exists",
			elem != null,
			'A "meta[name=viewport]" tag must exist',
		);

		context.assert(
			"viewport.single",
			rest.length === 0,
			'Must have only one "viewport" meta tag',
			rest[0],
		);

		if (!elem) return;

		let content = elem.getAttr("content") || "";

		context.assert(
			"viewport.content.empty",
			content.trim().length > 0,
			'Must not have empty "content" value',
			elem,
		);

		let props = new Map(
			content.split(/[,;]/).map((pair) => {
				let [key, value = ""] = pair.split("=");
				return [key.trim().toLowerCase(), value.trim().toLowerCase()];
			}),
		);

		context.assert(
			"viewport.content.device",
			props.get("width") === "device-width",
			'Must include "width=device-width" value',
			elem,
		);

		context.assert(
			"viewport.content.scale",
			Number(props.get("initial-scale")) === 1,
			'Must include "initial-scale=1" value',
			elem,
		);

		let scalable = props.get("user-scalable");
		let maximum = Number(props.get("maximum-scale") ?? Infinity);
		context.assert(
			"viewport.content.zoom",
			scalable !== "no" && scalable !== "0" && !(maximum < 2),
			'Must not use "user-scalable=no" or a "maximum-scale" below 2',
			elem,
		);
	},
});
