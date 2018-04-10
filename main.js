let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(dom); //load stageDrawing code
let stageView = new StageView(dom); //load stageView code

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.stageView = Util.one("#stageView");
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.confirmStage = Util.one("#confirmStage");

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
    }
});