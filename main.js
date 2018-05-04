//TODO: Show stage dimensions in chosen units above the done button
//TODO: Remove music bar unless we have time
//TODO: If have time, @ tags in formation comments
//TODO: Make instructions box collapsible
let dom = {}; //Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
let stageView = new StageView(); //load stageView code
let timeline; //load stageView code, initialized when content loaded
let groupsView = new GroupsView();
console.log("got this far");
//Attaching events on document
Util.events(document, {
    //runs at the end of start-up when the DOM is ready
    "DOMContentLoaded": () => {
        dom.drawingMode = true;
        
        dom.root = Util.one("html");
        dom.sansFont = Util.getStyleValue(dom.root, "--sans-font");
        dom.stageDrawing = Util.one("#stageDrawing");
        dom.stageDrawingControls = Util.one("#stageDrawingControls");
        dom.gridScaleValue = Util.one("#gridScaleValue"); //TODO: Add events
        dom.gridScaleUnits = Util.one("#gridScaleUnits"); //TODO: Add events
        dom.showGrid = Util.one("#showGridCheck");
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
        dom.timelinePaddingLeft = Util.one("#timelinePaddingLeft");
        dom.timelinePaddingRight = Util.one("#timelinePaddingRight");
        dom.formationCommentsBox = Util.one("#formationCommentsBox");
        dom.formationTitle = Util.one("#formationTitle");
        dom.addGroup = Util.one("#addGroup");
        dom.groupsDiv = Util.one("#groupsDiv");

        stageView.ctx = getTrackedContext(dom.stageView.getContext('2d', { alpha: false }));

        dom.showGrid.addEventListener("click", () => stageView.showGridPress(dom.showGrid.checked));
        dom.snapToGrid.addEventListener("click", () => stageView.snapToGridPress(dom.snapToGrid.checked));
        dom.showDancerSize.addEventListener("click", () => stageView.showDancerSizePress(dom.showDancerSize.checked));
        dom.confirmStage.addEventListener("click", () => stageView.doneDrawing());
        dom.addDancer.addEventListener("click", () => stageView.addDancer());
        dom.removeDancer.addEventListener("click", () => stageView.removeDancer());
        dom.addGroup.addEventListener("click", () => groupsView.addGroup());
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