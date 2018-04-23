let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageDrawing = new StageDrawing(); //load stageDrawing code
let stageView = new StageView(); //load stageView code
let timeline; //load stageView code, initialized when content loaded

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.root = Util.one("html");
        dom.sansFont = Util.getStyleValue(dom.root, "--sans-font");
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.drawingCanvas = Util.one("#drawingCanvas");
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
        dom.insertFormation = Util.one("#insertFormation");
        dom.deleteFormation = Util.one("#deleteFormation");
        dom.timelinePaddingLeft = Util.one("#timelinePaddingLeft");
        dom.timelinePaddingRight = Util.one("#timelinePaddingRight");
        dom.formationCommentsBox = Util.one("#formationCommentsBox");
        dom.formationTitle = Util.one("#formationTitle");


        stageDrawing.ctx = dom.drawingCanvas.getContext('2d', { alpha: false });
        stageView.ctx = getTrackedContext(dom.stageView.getContext('2d', { alpha: false }));

        dom.confirmStage.addEventListener("click", () => stageDrawing.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
        dom.zoomIn.addEventListener("click", () => stageView.zoomAnim(20, 1.3));
        dom.zoomOut.addEventListener("click", () => stageView.zoomAnim(20, -1.3));
        dom.resetView.addEventListener("click", () => stageView.resetView());
        dom.insertFormation.addEventListener("click", () => timeline.insertFormation());
        dom.addFormation.addEventListener("click", () => timeline.addFormation());
        dom.deleteFormation.addEventListener("click", () => timeline.deleteFormation());
        dom.formationTitle.addEventListener("keyup", () => {
            timeline.formations[timeline.curr].name.innerText = dom.formationTitle.value;
            timeline.formations[timeline.curr].name.resizeMe();
            formationTitleWidth();
        });

        stageDrawing.respondCanvas();
        stageView.respondCanvas(true);
        window.onresize = () => onResize();
        Util.events(dom.drawingCanvas, {
            "mousedown": evt => {
                stageDrawing.mousedown(getCanvasCoords(dom.drawingCanvas, evt), evt.buttons);
            },
            "mousemove": evt => {
                stageDrawing.mousemove(getCanvasCoords(dom.drawingCanvas, evt));
            },
            "mouseup": evt => {
                stageDrawing.mouseup(getCanvasCoords(dom.drawingCanvas, evt));
            },
            "dblclick": evt => {
                stageDrawing.dblclick();
            }
        });
        Util.events(dom.stageView, {
            "mousedown": evt => {
                stageView.mousedown(getCanvasCoords(dom.stageView, evt), evt.buttons);
            },
            "click": evt => {
                stageView.click(getCanvasCoords(dom.stageView, evt));
            },
            "dblclick": evt => {
                stageView.dblclick(getCanvasCoords(dom.stageView, evt));
            },
            "mousewheel": evt => {
                stageView.mousewheel(evt, getCanvasCoords(dom.stageView, evt));
                return evt.preventDefault() && false;
            },
            "keypress": evt => {
                stageView.keypress(evt);
            },
            "keydown": evt => {
                stageView.keydown(evt);
            }
        });


        window.setInterval(() => {
            if (stageView.redrawThumb && timeline.formations.length !== 0) {
                stageView.draw(timeline.formations[timeline.curr].ctx);
                stageView.redrawThumb = false;
            }
        }, 1000);
    },
    "mousemove": evt => {
        if (timeline.mouse.dragging) {
            timeline.mouse.x = evt.clientX;
            timeline.dragSlide(evt);
            return evt.preventDefault() && false;
        } else {
            stageView.mousemove(getCanvasCoords(dom.stageView, evt));
            if (stageView.isDragging()) return evt.preventDefault() && false;
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
    },
    "mousedown": evt => {
        stageView.mousedownOutside();
    }
});
function getCanvasCoords(canvas, evt) {
    let topLeft = Util.offset(canvas);
    return { x: evt.clientX - topLeft.left, y: evt.clientY - topLeft.top };
}

function formationTitleWidth() {
    let width = stageView.measureText(dom.sansFont,
        Util.getStyleValue(dom.formationTitle, "font-size"), "normal", dom.formationTitle.value);
    dom.formationTitle.style.setProperty("width", `${width + 40}px`);
}

function onResize(){
    stageView.respondCanvas();
    stageDrawing.respondCanvas();
}