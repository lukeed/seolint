let button = document.querySelector<HTMLButtonElement>(".theme");

button?.addEventListener("click", () => {
	let next =
		document.documentElement.dataset.theme === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	localStorage.setItem("theme", next);
});
