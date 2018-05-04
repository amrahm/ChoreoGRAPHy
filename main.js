//TODO: Show stage dimensions in chosen units above the done button
//TODO: Remove music bar unless we have time
//TODO: If have time, @ tags in formation comments
//TODO: Make instructions box collapsible
let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageView = new StageView(); //load stageView code
let timeline; //load stageView code, initialized when content loaded
let undoStack = [];
let redoStack = [];

//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.drawingMode = true;

        dom.root = Util.one("html");
        dom.undo = Util.one("#undo");
        dom.redo = Util.one("#redo");
        dom.sansFont = Util.getStyleValue(dom.root, "--sans-font");
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.stageDrawingControls = Util.one("#stageDrawingControls");
        dom.gridScaleDiv = Util.one("#gridScale");
        dom.gridScaleValue = Util.one("#gridScaleValue");
        dom.gridScaleUnits = Util.one("#gridScaleUnits");
        dom.showGrid = Util.one("#showGridCheck");
        dom.snapToGridDiv = Util.one("#snapToGrid");
        dom.snapToGrid = Util.one("#snapToGridCheck");
        dom.showDancerSize = Util.one("#showDancerSizeCheck");
        dom.confirmStage = Util.one("#confirmStage");
        dom.drawingInstruction = Util.one("#drawingInstruction");
        dom.stageViewControls = Util.one("#stageViewControls");
        dom.stageViewControls.style.display = "inline";
        dom.timeline = Util.one("#timeline");
        timeline = new Timeline(parseFloat(Util.getStyleValue(dom.root, "--slide-t")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-width")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-height")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-spacing")),
            parseFloat(Util.getStyleValue(dom.root, "--slide-smaller")));
        dom.addDancer = Util.one("#addDancer");
        dom.removeDancer = Util.one("#removeDancer");
        dom.zoomIn = Util.one("#zoomIn");
        dom.zoomOut = Util.one("#zoomOut");
        dom.resetView = Util.one("#resetView");
        dom.stageView = Util.one("#stageView");
        dom.addFormation = Util.one("#addFormation");
        dom.insertFormation = Util.one("#insertFormation");
        dom.deleteFormation = Util.one("#deleteFormation");
        dom.formationCommentsBox = Util.one("#formationCommentsBox");
        dom.formationTitle = Util.one("#formationTitle");


        stageView.setContext(dom.stageView.getContext('2d', { alpha: false }));

        dom.undo.addEventListener("click", () => undo());
        dom.redo.addEventListener("click", () => redo());
        dom.showGrid.addEventListener("change", () => stageView.showGridPress());
        dom.gridScaleValue.addEventListener("keyup", () => stageView.gridScaleChange());
        dom.gridScaleUnits.addEventListener("change", () => stageView.gridScaleChange());
        dom.snapToGrid.addEventListener("change", () => stageView.snapToGridPress());
        dom.showDancerSize.addEventListener("change", () => stageView.showDancerSizePress());
        dom.confirmStage.addEventListener("click", () => stageView.doneDrawing());
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

        stageView.respondCanvas(true);
        window.onresize = () => stageView.respondCanvas();
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
function undo() {
    let state = undoStack.pop();
    redoStack.push(state);
    stageView = state.stageView;
    timeline = state.timeline;
    stageView.draw();
    console.log(undoStack);
}
function redo() {
    let state = redoStack.pop();
    undoStack.push(state);
    stageView = state.stageView;
    timeline = state.timeline;
}

/** Save the state of an object before modifiying it so it can be undone
 * @param {number} stateNum 0 = save all, 1 = save stageView, 2 = save timeline
 */
function saveState(stateNum = 0) {
    let state = {};

    if (stateNum === 0 || stateNum === 1) {
        state.stageView = JSON.parse(JSON.stringify(stageView));
    } else {
        state.stageView = stageView;
    }

    if (stateNum === 0 || stateNum === 2) {
        state.timeline = JSON.parse(JSON.stringify(timeline));
    } else {
        state.timeline = timeline;
    }

    undoStack.push(state);
    redoStack = []; //Remove this line for non-linear history?
    console.log(undoStack);
}