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
        dom.zoomIn = Util.one("#zoomIn");
        dom.zoomOut = Util.one("#zoomOut");
        dom.resetView = Util.one("#resetView");
        dom.stageView = Util.one("#stageView");

        stageView.ctx = dom.stageView.getContext('2d', { alpha: false });

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
        dom.zoomIn.addEventListener("click", () => stageView.zoomAnim(20, 1.3));
        dom.zoomOut.addEventListener("click", () => stageView.zoomAnim(20, -1.3));
        dom.resetView.addEventListener("click", () => stageView.resetView());

        stageView.trackTransforms();
        stageView.respondCanvas(true);
        window.onresize = () => stageView.respondCanvas();
        Util.events(dom.stageView, {
            "mousedown": evt => {
                stageView.mousedown(getCanvasCoords(evt), evt.buttons);
                return evt.preventDefault() && false;
            },
            "mousemove": function (evt) {
                evt.preventDefault();
                stageView.mousemove(getCanvasCoords(evt));
                return evt.preventDefault() && false;
            },
            "mouseup": evt => {
                evt.preventDefault();
                stageView.mouseup();
                return evt.preventDefault() && false;
            },
            "mouseenter": evt => {
                evt.preventDefault();
                stageView.mouseenter(evt.buttons);
                return evt.preventDefault() && false;
            },
            "click": evt => {
                evt.preventDefault();
                stageView.mouseclick(getCanvasCoords(evt));
                return evt.preventDefault() && false;
            },
            "mousewheel": evt => {
                stageView.handleScroll(evt);
                return evt.preventDefault() && false;
            }
        })
    }


});
function getCanvasCoords(evt) {
    let topLeft = Util.offset(dom.stageView);
    return { x: evt.clientX - topLeft.left, y: evt.clientY - topLeft.top };
}