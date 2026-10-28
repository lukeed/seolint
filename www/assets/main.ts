let button = document.querySelector<HTMLButtonElement>(".theme");

button?.addEventListener("click", () => {
	let next =
		document.documentElement.dataset.theme === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	localStorage.setItem("theme", next);
});

let sidebar = document.querySelector<HTMLDetailsElement>(".sidebar");
if (sidebar && matchMedia("(max-width: 980px)").matches) sidebar.open = false;

let links = [...document.querySelectorAll<HTMLAnchorElement>(".toc a")];
let headings = links.flatMap((link) => {
	let target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
	return target ? [{ link, target }] : [];
});

/**
 * Mark the "On this page" link of the last heading above the top of the view.
 */
function spy(): void {
	let current = headings[0];
	for (let item of headings) {
		if (item.target.getBoundingClientRect().top > 96) break;
		current = item;
	}
	for (let { link } of headings) {
		if (link === current?.link) link.setAttribute("aria-current", "true");
		else link.removeAttribute("aria-current");
	}
}

if (headings.length > 0) {
	let pending = false;
	addEventListener(
		"scroll",
		() => {
			if (pending) return;
			pending = true;
			requestAnimationFrame(() => {
				pending = false;
				spy();
			});
		},
		{ passive: true },
	);
	spy();
}
