class CoreHandler {
    init() {
        // Input form submit listener
        document.getElementById("input_form")
            .addEventListener("submit", (e) => this.submitHandler(e));

        // Global click listener because it loads in dynamically
        document.body.addEventListener('click', (e) => this.retryClick(e));
    }

    /**
     * Submit event listener
     * @param e
     */
    submitHandler(e) {
        e.preventDefault();

        // Input name
        let name = e.target.elements.data.value;

        // Validate name
        if (name === undefined || name.length < 1) {
            alert("Voer een naam in");
            return;
        }

        this.hideForm();

        // Get & render data
        GrisManager.getInstance().start(name, () => {
            new RenderManager().render(name);

            this.calculateAndShowData();
        });

    }

    /**
     * Retry event listener
     * @param event
     */
    retryClick(event) {
        if (event.target.id === 'try_again') {
            this.closeResult();
            this.showForm();
        }
    }

    /**
     * Calculate animation and show results
     */
    calculateAndShowData() {
        let data = document.getElementById("data");
        let work = document.getElementById("work");

        // Calculate height for animation (a bit hacky but no other way to do this)
        data.style.display = "block";
        let height = document.getElementById("data").scrollHeight;
        data.style.display = "none";

        // Use calculated height for animation
        work.style.height = (height) + "px";
        work.classList.add("showResult");

        // Prepare data for fadein after animation
        setTimeout(() => {
            data.style.display = "block";

            // Hotfix for mobile phones
            work.style.height = document.getElementById("data").scrollHeight + "px";
        }, 500);

        // Fade in data
        setTimeout(() => data.style.opacity = "1", 600);
    }

    /**
     * Close result with animation
     */
    closeResult() {
        let data = document.getElementById("data");
        let work = document.getElementById("work");

        // Clear data & hide for the next name
        data.innerHTML = "";
        data.style.display = "none";
        data.style.opacity = "0";

        // Animate result close
        work.style.height = "1em";
        work.classList.remove("showResult");
    }

    /**
     * Animate and show form
     *
     * @param instant - animate or show instant
     */
    showForm(instant = false) {
        if (!instant)
            return setTimeout(() => this.showForm(true), 300);

        let form = document.getElementById("formpje");
        form.style.transform = "translate(150vw)";
        form.classList.add("show");
        form.classList.remove("hide");

        // Focus on field
        document.getElementById("input_name").focus();
    }

    /**
     * Hide form after submit
     */
    hideForm() {
        let form = document.getElementById("formpje");
        form.style.transform = "translate(0, 0)";
        form.classList.remove("show");
        form.classList.add("hide");

        this.clearInput();
    }

    /**
     * Clear input for the next round
     */
    clearInput() {
        // Clear input & remove focus
        let input = document.getElementById("input_name");

        input.blur();
        input.value = "";
    }

}

// This'll start the magic
new CoreHandler().init();