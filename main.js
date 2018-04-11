let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(dom); //load stageDrawing code
let stageView = new StageView(dom); //load stageView code

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.confirmStage = Util.one("#confirmStage");
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");
        dom.stageView = Util.one("#stageView");
        stageView.ctx = dom.stageView.getContext('2d');

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());

        stageView.respondCanvas();
        window.onresize = () => stageView.respondCanvas();

        dom.stageView.addEventListener("mousedown", evt => {
            evt.preventDefault();
            stageView.mousedown(getCanvasCoords(evt));
            return false;
        });
        dom.stageView.addEventListener("mousemove", function(evt){
            evt.preventDefault();
            stageView.mousemove(getCanvasCoords(evt));
            return false;
        });
        dom.stageView.addEventListener("mouseup", evt => {
            evt.preventDefault();
            stageView.mouseup();
            return false;
        });
        dom.stageView.addEventListener("mouseenter", evt => {
            evt.preventDefault();
            stageView.mouseenter(evt.buttons);
            return false;
        });
        dom.stageView.addEventListener("click", evt => {
            evt.preventDefault();
            stageView.mouseclick(getCanvasCoords(evt));
            return false;
        });
    }

    
});
function getCanvasCoords(evt){
    let topLeft = Util.offset(dom.stageView);
    return { X: evt.clientX - topLeft.left, Y: evt.clientY - topLeft.top };
}