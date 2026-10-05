(() => {
    const storageKey = "teamruby:vhs-disabled";
    const button = document.createElement("button");
    let filterDisabled = false;

    try {
        filterDisabled = localStorage.getItem(storageKey) === "true";
    } catch {
        filterDisabled = false;
    }

    button.id = "vhs-toggle";
    button.type = "button";
    button.setAttribute("aria-pressed", String(!filterDisabled));
    button.textContent = filterDisabled ? "Turn VHS On" : "Turn VHS Off";
    document.body.appendChild(button);
    document.body.classList.toggle("vhs-disabled", filterDisabled);

    button.addEventListener("click", () => {
        filterDisabled = !filterDisabled;
        document.body.classList.toggle("vhs-disabled", filterDisabled);
        button.textContent = filterDisabled ? "Turn VHS On" : "Turn VHS Off";
        button.setAttribute("aria-pressed", String(!filterDisabled));
        try {
            localStorage.setItem(storageKey, String(filterDisabled));
        } catch {
            return;
        }
    });

    window.addEventListener("storage", (event) => {
        if (event.key !== storageKey && event.key !== null) return;
        filterDisabled = event.newValue === "true";
        document.body.classList.toggle("vhs-disabled", filterDisabled);
        button.textContent = filterDisabled ? "Turn VHS On" : "Turn VHS Off";
        button.setAttribute("aria-pressed", String(!filterDisabled));
    });
})();
