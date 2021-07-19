// 0, "off", false -> disable
// 1, "warn", <---> -> warn
// 2, "error", true -> error
export const rules = {
	'canonical.exists': 2,
	'canonical.single': 2,
	'canonical.absolute': 2,
	'canonical.match': 1,

	'title.exists': 2,
	'title.single': 2,
	'title.content.html': 2,
	'title.content.undefined': 2,
	'title.content.null': 2,
	// 'title.content.exclude': [2, {
	// 	words:
	// }],
	'title.length': [2, {
		min: 10,
		avg: 120,
		max: 300
	}],

	'description.exists': 2,
	'description.single': 2,
	'description.content': 2,
	'description.length': 2,
	'description.title': 2,

	'h1.exists': 2,
	'h1.single': 2,
	'h1.content': 2,
	'h1.length': 2,
	'h1.title': 2,

	'h2.exists': 2,
	'h2.single': 2,
	'h2.ladder': 2,
	'h2.content': 2,
	'h2.length': 2,
	'h2.title': 2,

	'h3.exists': 2,
	'h3.single': 2,
	'h3.ladder': 2,
	'h3.content': 2,
	'h3.length': 2,
	'h3.title': 2,

	'h4.exists': 2,
	'h4.single': 2,
	'h4.ladder': 2,
	'h4.content': 2,
	'h4.length': 2,
	'h4.title': 2,

	'h5.exists': 2,
	'h5.single': 2,
	'h5.ladder': 2,
	'h5.content': 2,
	'h5.length': 2,
	'h5.title': 2,

	'h6.exists': 2,
	'h6.single': 2,
	'h6.ladder': 2,
	'h6.content': 2,
	'h6.length': 2,
	'h6.title': 2,

	'viewport.exists': 2,
	'viewport.single': 2,
	'viewport.content': 2,
	'viewport.device': 2,
	'viewport.scale': 2,

	'link.internal.trailing': 2,
	'link.internal.lowercase': 2,
	'link.internal.nofollow': 2,
	'link.internal.pretty': 2,
	'link.internal.https': 2,

	'link.external.limit': [2, 50],
	'link.external.follow': 1,
	'link.external.https': 1,

	'image.alt': 2,
}
