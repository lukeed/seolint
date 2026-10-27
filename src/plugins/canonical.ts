import { plugin } from "../plugin";

export const canonical = plugin({
	name: "canonical",
	rules: {
		"canonical.exists": true,
		"canonical.single": true,
		"canonical.href.exists": true,
		"canonical.href.absolute": true,
		"canonical.href.lowercase": true,
		"canonical.href.https": true,
		"canonical.href.match": { hostname: "" },
	},
	run(context, document) {
		let [elem, ...rest] = document.all("link[rel=canonical]");

		context.assert(
			"canonical.exists",
			elem != null,
			"A canonical link must exist",
		);
		context.assert(
			"canonical.single",
			rest.length === 0,
			"Must have only one canonical link",
			rest[0],
		);
		if (!elem) return;

		let target = elem.getAttr("href") || "";

		context.assert(
			"canonical.href.exists",
			target.length > 0,
			"Must not have empty `href` target",
		);

		context.assert(
			"canonical.href.absolute",
			/^https?:\/\//.test(target),
			"Must include a URL protocol in target",
			elem,
		);

		context.assert(
			"canonical.href.lowercase",
			!/[A-Z]/.test(target),
			"Must not include uppercase character(s)",
			elem,
		);

		context.assert(
			"canonical.href.https",
			/^https:\/\//.test(target),
			'Must point to an "https://" address',
			elem,
		);

		let { host } = context.options;

		context.assert(
			"canonical.href.match",
			(o) => target.includes(o.hostname || host || "\0"),
			"Must include the provided `hostname` value",
			elem,
		);
	},
});
