let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(dom); //load stageDrawing code
let stageView = new StageView(dom); //load stageView code

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.timeline = Util.one("#timeline");
        dom.confirmStage = Util.one("#confirmStage");
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");
        dom.zoomIn = Util.one("#zoomIn");
        dom.zoomOut = Util.one("#zoomOut");
        dom.resetView = Util.one("#resetView");
        dom.stageView = Util.one("#stageView");
        dom.stageViewControls = Util.one("#stageViewControls");
        dom.stageViewControls.style.display = "inline";



        stageView.ctx = getTrackedContext(dom.stageView.getContext('2d', { alpha: false }));

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
        dom.zoomIn.addEventListener("click", () => stageView.zoomAnim(20, 1.3));
        dom.zoomOut.addEventListener("click", () => stageView.zoomAnim(20, -1.3));
        dom.resetView.addEventListener("click", () => stageView.resetView());

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
                stageView.mousewheel(evt);
                return evt.preventDefault() && false;
            }
        })

        addFormation();
    },
    "mousemove": function (evt) {
        stageView.mousemove(getCanvasCoords(evt));
        if(stageView.isDragging()) return evt.preventDefault() && false;
    },
    "mouseup": evt => {
        stageView.mouseup();
        if(stageView.isDragging()) return evt.preventDefault() && false;
    },
    "mouseenter": evt => {
        stageView.mouseenter(evt.buttons);
        if(stageView.isDragging()) return evt.preventDefault() && false;
    }
});
function getCanvasCoords(evt) {
    let topLeft = Util.offset(dom.stageView);
    return { x: evt.clientX - topLeft.left, y: evt.clientY - topLeft.top };
}

function addFormation() {
    let newSlide = document.createElement("div");
    newSlide.classList.add("formationSlide");
    dom.timeline.appendChild(newSlide);

    let img = document.createElement("canvas");
    newSlide.appendChild(img);
    img.setAttribute("width", parseInt(Util.getStyleValue(img, "width"))); //resize good
    img.setAttribute("height", parseInt(Util.getStyleValue(img, "height")));

    let ctx = getTrackedContext(img.getContext('2d', { alpha: false }));
    stageView.selectedFormationCtx = ctx;
    stageView.draw(ctx);
}