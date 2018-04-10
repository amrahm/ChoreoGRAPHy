let dom = {}; // Holds DOM elements that don’t change, to avoid repeatedly querying the DOM

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
    // Final initalization entry point: the Javascript code inside this block
    // runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        // Element refs
        dom.stageView = Util.one("#stageView");
    }
});