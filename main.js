let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(); //load stageDrawing code
let stageView = new StageView(); //load stageView code
let timeline; //load stageView code, initialized when content loaded

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.root = Util.one("html");
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.timeline = Util.one("#timeline");
        timeline = new Timeline(parseFloat(Util.getStyleValue(dom.root, "--slide-t")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-width")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-height")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-spacing")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-smaller")));
        dom.confirmStage = Util.one("#confirmStage");
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");
        dom.zoomIn = Util.one("#zoomIn");
        dom.zoomOut = Util.one("#zoomOut");
        dom.resetView = Util.one("#resetView");
        dom.stageView = Util.one("#stageView");
        dom.stageViewControls = Util.one("#stageViewControls");
        dom.stageViewControls.style.display = "inline";
        dom.addFormation = Util.one("#addFormation");
        dom.deleteFormation = Util.one("#deleteFormation");
        dom.timelinePaddingLeft = Util.one("#timelinePaddingLeft");
        dom.timelinePaddingRight = Util.one("#timelinePaddingRight");



        stageView.ctx = getTrackedContext(dom.stageView.getContext('2d', { alpha: false }));

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
        dom.zoomIn.addEventListener("click", () => stageView.zoomAnim(20, 1.3));
        dom.zoomOut.addEventListener("click", () => stageView.zoomAnim(20, -1.3));
        dom.resetView.addEventListener("click", () => stageView.resetView());
        dom.addFormation.addEventListener("click", () => timeline.addFormation());
        dom.deleteFormation.addEventListener("click", () => timeline.deleteFormation());

        stageView.respondCanvas(true);
        window.onresize = () => stageView.respondCanvas();
        Util.events(dom.stageView, {
            "mousedown": evt => {
                stageView.mousedown(getCanvasCoords(evt), evt.buttons);
                return evt.preventDefault() && false;
            },
            "click": evt => {
                stageView.mouseclick(getCanvasCoords(evt));
                return evt.preventDefault() && false;
            },
            "mousewheel": evt => {
                stageView.mousewheel(evt, getCanvasCoords(evt));
                return evt.preventDefault() && false;
            }
        });
        Util.events(dom.stageViewControls, {
            "mousedown": evt => (evt.preventDefault() && false)
        });

        timeline.addFormation();

        window.setInterval(() => {
            if (stageView.redrawThumb) {
                stageView.draw(timeline.formations[timeline.curr].ctx);
                stageView.redrawThumb = false;
            }
        }, 1000);
    },
    "mousemove": function (evt) {
        if (stageView.isDragging()) {
            stageView.mousemove(getCanvasCoords(evt));
            return evt.preventDefault() && false;
        } else if (timeline.mouse.dragging) {
            timeline.mouse.x = evt.clientX;
            timeline.dragSlide(evt);
            return evt.preventDefault() && false;
        }
    },
    "mouseup": evt => {
        let wasDragging = timeline.mouse.dragging || stageView.isDragging();
        stageView.mouseup();
        timeline.mouse.dragging = false;
        timeline.mouse.numSwaps = 0;
        if (wasDragging) return evt.preventDefault() && false;
    },
    "mouseenter": evt => {
        let wasDragging = timeline.mouse.dragging || stageView.isDragging();
        stageView.mouseenter(evt.buttons);
        if (wasDragging) return evt.preventDefault() && false;
    }
});
function getCanvasCoords(evt) {
    let topLeft = Util.offset(dom.stageView);
    return { x: evt.clientX - topLeft.left, y: evt.clientY - topLeft.top };
}