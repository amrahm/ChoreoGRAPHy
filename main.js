let dom = {}; // Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(dom); // load stageDrawing code
let stageView = new StageView(dom); // load stageView code

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
    // Final initalization entry point: the Javascript code inside this block
    // runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        stageDrawing.domContentLoaded();
        stageView.domContentLoaded();
    }
});