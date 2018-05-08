//TODO: Zoom min and max
//TODO: Front view
//TODO: CTRL/Shift for selecting multiple

const dancerRadius = 20; //radius of dancer, in centimeters
const dancerFontSize = 25; //in px
const boxSize = 10;
const distThreshold = 15; //num pixels close that are considered close enough to grid corner

/** Implements the top and front stage views, with adding and removing dancers */
class StageView extends EventTarget {
    constructor(ctx, groups) {
        super();
        this.ctx = getTrackedContext(ctx);
        this.width = null; //initialized in respondCanvas()
        this.height = null; //^

        // to interact with groups controls
        this.groups = groups;

        //:::Stage Drawing
        this.drawingMode = true;
        this.lastM = null;
        this.mdDrawing = false; //is the mouse down and drawing a line?
        this.mdMoving = false; //is the mouse down and moving a point?
        this.firstPoint = null;
        this.closed = false;
        this.points = [];
        this.currPoint = 0;
        this.showGrid = true;
        this.gridScale = dancerRadius * 2;
        this.snapToGrid = true;
        this.showDancerSize = false;
        this.firstStageDraw = true;

        //:::Stage Viewing
        this.pageDrag = null; //dragging page
        this.dragging = null; //dragged dancer
        this.hovering = null; //dancer under mouse
        this.rotating = null; //rotating dancer
        this.renaming = null; //renaming dancer
        this.renamingStart = false; //reset name only for first letter typed
        this.selP1 = null; //Start point of box selection
        this.selP2 = null; //End point of box selection
        this.selectionBox = null; //The actual box, for hitTesting
        this.selected = []; //selected dancers
        this.dancers = []; //ex: {name: "name", positions: [pos, ...]}; pos = {x: x, y:y, angle: angle}
        this.redrawThumb = false; //should the formation thumbnail be redrawn?

        //:::STAGE
        this.stage = new Path2D();
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }; //pixel size of stage
    }

    /** Respond to window resize so that drawings don't get distorted. */
    respondCanvas(firstTime = false) {
        let oldC = this.ctx.transformedPoint(this.width / 2, this.height / 2);
        let oldT = this.ctx.getTransform();
        this.ctx.resetTransform();
        this.width = parseInt(Util.getStyleValue(dom.stageView, "width"));
        this.height = parseInt(Util.getStyleValue(dom.stageView, "height"));
        dom.stageView.setAttribute("width", this.width);
        dom.stageView.setAttribute("height", this.height);
        if (!firstTime) {
            this.ctx.transform(oldT.a, oldT.b, oldT.c, oldT.d, oldT.e, oldT.f);
            let newC = this.ctx.transformedPoint(this.width / 2, this.height / 2);
            this.ctx.translate(newC.x - oldC.x, newC.y - oldC.y);
        }
        this.draw();
    }

    /** Draw the stage, dancers, etc. */
    draw(ctx = this.ctx, resize = false, formation = timeline.curr) {
        if (ctx === this.ctx)
            this.redrawThumb = true;
        else if (resize) {
            this.resetView(ctx, parseInt(Util.getStyleValue(ctx.canvas, "width")),
                parseInt(Util.getStyleValue(ctx.canvas, "height")));
        }

        if (this.drawingMode) { //:::STAGE DRAWING
            ctx.save();
            ctx.resetTransform();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();

            let sBoxSize = (boxSize + boxSize / ctx.scaled.x) / 2;
            if (this.firstPoint !== null) {
                ctx.strokeStyle = "rgb(0, 0, 0)";
                let stage = new Path2D();
                this.points.forEach(point => {
                    stage.lineTo(point.x, point.y);
                });
                this.stage = stage;
                if (this.closed) {
                    ctx.fillStyle = "rgb(255, 250, 245)";
                    ctx.fill(this.stage);
                }
                ctx.strokeStyle = "rgb(0, 0, 0)";
                ctx.stroke(this.stage);

                ctx.lineWidth = 1 / ctx.scaled.x;
                if (!this.closed) {
                    ctx.beginPath();
                    ctx.arc(this.firstPoint.x, this.firstPoint.y, sBoxSize, 0, Math.PI * 2);
                    ctx.fillStyle = this.currPoint == 0 ? "rgb(66, 134, 244)" : "rgb(200, 200, 200)";
                    ctx.fill();
                    ctx.strokeStyle = "rgb(0, 0, 0)";
                    ctx.stroke();
                }
                if (this.points.length > 0 && this.currPoint != 0 || this.closed) {
                    let currPt = this.points[this.currPoint];
                    ctx.fillStyle = "rgb(66, 134, 244)";
                    ctx.fillRect(currPt.x - sBoxSize / 2, currPt.y - sBoxSize / 2, sBoxSize, sBoxSize);
                }
                this.points.forEach(point => {
                    if (this.closed || point !== this.firstPoint)
                        ctx.strokeRect(point.x - sBoxSize / 2, point.y - sBoxSize / 2, sBoxSize, sBoxSize);
                });
                ctx.lineWidth = 1;
            }
            if (this.closed) {
                this.stage.closePath();
                ctx.strokeStyle = "rgb(0, 0, 0)";
                ctx.stroke(this.stage);
                ctx.fillStyle = "rgb(66, 134, 244)";
                let currPt = this.points[this.currPoint];
                ctx.fillRect(currPt.x - sBoxSize / 2, currPt.y - sBoxSize / 2, sBoxSize, sBoxSize);
            }
        } else {
            ctx.save();
            ctx.resetTransform();
            ctx.fillStyle = "rgb(180, 180, 180)";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();

            //:::STAGE
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.fillStyle = "rgb(255, 250, 245)";
            ctx.fill(this.stage);
            ctx.shadowBlur = 0;
        }

        //:::DANCERS
        // console.log("DANCERS", this.dancers);
        this.dancers.forEach(dancer => this.drawDancer(ctx, dancer, formation));

        //:::DRAG HANDLE part 2
        if (ctx === this.ctx) {
            this.selected.forEach(dancer => {
                let pos = dancer.positions[formation];
                let r = dancerRadius;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);

                let icon = new Path2D();
                icon.arc(0, r * 1.6, r * .4, 0, (9.8 / 6) * Math.PI);
                icon.arc(0, r * 1.6, r * .4 * 0.5, (9.5 / 6) * Math.PI, 0.04 * Math.PI, true);
                icon.lineTo(r * 0.05, r * 1.65);
                icon.lineTo(r * 0.24, r * 1.37);
                icon.lineTo(r * 0.54, r * 1.58);
                icon.closePath();
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.fill(icon);
                ctx.strokeStyle = "rgb(255, 255, 255)";
                ctx.stroke(icon);

                dancer.rotateIcon = new Path2D(); //bounding box to make clicking easier
                dancer.rotateIcon.moveTo(-r * 0.5, r * 1.1);
                dancer.rotateIcon.lineTo(r * 0.5, r * 1.1);
                dancer.rotateIcon.lineTo(r * 0.5, r * 2.1);
                dancer.rotateIcon.lineTo(-r * 0.5, r * 2.1);
                dancer.rotateIcon.closePath();
                ctx.restore();
            });
        }

        //:::BOX SELECT
        if (this.selP1 != null && this.selP2 != null && ctx === this.ctx) {
            this.selectionBox = new Path2D();
            this.selectionBox.rect(this.selP1.x, this.selP1.y,
                this.selP2.x - this.selP1.x, this.selP2.y - this.selP1.y);
            this.ctx.fillStyle = "rgba(130, 166, 255, .5)";
            this.ctx.fill(this.selectionBox);
            this.ctx.strokeStyle = "rgb(130, 166, 255)";
            this.ctx.stroke(this.selectionBox);
        }

        //:::GRID
        if (this.showGrid) {
            ctx.lineWidth = 1 / ctx.scaled.x;
            ctx.strokeStyle = "rgb(200, 200, 200)";
            ctx.beginPath();

            let pt = ctx.transformedPoint(0, 0);
            let maxpt = ctx.transformedPoint(this.width, this.height);
            for (let x = Math.ceil(pt.x / this.gridScale) * this.gridScale;
                x < maxpt.x; x += this.gridScale) {
                ctx.moveTo(x, pt.y);
                ctx.lineTo(x, maxpt.y);
            }
            for (let y = Math.ceil(pt.y / this.gridScale) * this.gridScale;
                y < maxpt.y; y += this.gridScale) {
                ctx.moveTo(pt.x, y);
                ctx.lineTo(maxpt.x, y);
            }

            ctx.stroke();
            ctx.lineWidth = 1;
        }

        //:::DANCER SIZE EXAMPLE
        if (this.drawingMode && this.showDancerSize) {
            let corner = ctx.transformedPoint(0, this.height);

            let dancer = {
                name: "Dancer",
                positions: [{
                    x: corner.x + dancerRadius * 1.4,
                    y: corner.y - dancerRadius * 1.4,
                    angle: 0
                }]
            };
            this.drawDancer(ctx, dancer, 0, true);
        }
    }


    /** Draw a dancer at their position in the specified formation */
    drawDancer(ctx, dancer, formation, isExample = false, r = dancerRadius) {
        // console.log("DANCERFormation", formation, dancer.positions);

        let pos = dancer.positions[formation];
        let group = dancer.groups[formation];
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);
        //:::MAIN CIRCLE
        if (this.dragging === dancer && ctx === this.ctx) {
            ctx.shadowBlur = 20;
            if (this.selected.indexOf(dancer) === -1)
                ctx.shadowColor = "black";
            else
                ctx.shadowColor = "rgb(23, 116, 0)";
        }
        else if (this.selected.indexOf(dancer) != -1 && ctx === this.ctx) {
            ctx.shadowBlur = 40;
            ctx.shadowColor = "rgb(43, 216, 0)";
        }
        else {
            ctx.shadowBlur = 0;
        }

        // this is where dancers are colored; need to edit for group colorings
        let fillColor = groupsView.getColorOfGroup(group);
        ctx.fillStyle = isExample || this.drawingMode ? "rgba(60, 60, 60, 0.7)" : fillColor;
        // end groupsview interaction
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.drawingMode ? "rgba(200, 200, 200, 0.7)" : "rgb(200, 200, 200)";
        ctx.stroke();
        if (!isExample) {
            //:::FACE            
            ctx.fillStyle = this.drawingMode ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.5)";
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI);
            ctx.bezierCurveTo(-r * .4, r * .55, r * .4, r * .55, r, 0);
            ctx.fill();
            ctx.strokeStyle = this.drawingMode ? "rgba(20, 20, 20, 0.7)" : "rgb(20, 20, 20)";
            ctx.stroke();
            //:::EYES
            ctx.fillStyle = this.drawingMode ? "rgba(250, 250, 250, 0.7)" : "rgb(250, 250, 250)";
            ctx.beginPath();
            ctx.arc(r * .45, r * .6, r / 5, 0, Math.PI * 2);
            ctx.arc(-r * .45, r * .6, r / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.drawingMode ? "rgba(0, 0, 0, 0.7)" : "rgb(0, 0, 0)";
            ctx.beginPath();
            ctx.arc(r * .45, r * .65, r / 10, 0, Math.PI * 2);
            ctx.arc(-r * .45, r * .65, r / 10, 0, Math.PI * 2);
            ctx.fill();
        }
        //:::NAME
        if (ctx === this.ctx) {
            ctx.save();
            let flipped = false;
            if (pos.angle > Math.PI / 2 || pos.angle < -Math.PI / 2) {
                ctx.rotate(Math.PI);
                ctx.textBaseline = "middle";
                flipped = true;
            }
            else {
                ctx.textBaseline = "alphabetic baseline";
            }
            let size = dancerFontSize;
            ctx.font = `normal normal 700 ${size}px ${dom.sansFont}`;
            ctx.textAlign = "center";
            let smaller = false;
            let width = ctx.measureText(dancer.name).width + 6;
            if (this.drawingMode || this.renaming !== dancer && this.hovering !== dancer &&
                !(this.selected.length === 1 && this.selected.indexOf(dancer) != -1)) {
                if (r / width * 2 < 1) {
                    size *= r / width * 2;
                    ctx.font = `normal normal 700 ${size}px ${dom.sansFont}`;
                    width = ctx.measureText(dancer.name).width + 6;
                }
                smaller = true;
            }
            let height = size;
            let offset = flipped ? -height / 2 : -height + height / 8;
            if (this.renamingStart && this.renaming === dancer) {
                this.ctx.fillStyle = "rgba(130, 166, 255, .5)";
                ctx.fillRect(-width / 2, offset, width, height);
            }
            else if (this.renaming === dancer) {
                this.ctx.fillStyle = "rgba(200, 186, 160, .5)";
                ctx.fillRect(-width / 2, offset, width, height);
            }
            ctx.strokeStyle = "rgb(0, 0, 0)";
            if (!smaller && !this.drawingMode) {
                ctx.strokeText(dancer.name, .5, .5);
                ctx.strokeText(dancer.name, -.5, .5);
                ctx.strokeText(dancer.name, .5, -.5);
                ctx.strokeText(dancer.name, -.5, -.5);
            } else if (isExample) {
                ctx.strokeText(dancer.name, 0, 0);
            }
            ctx.fillStyle = this.drawingMode && !isExample ? "rgba(255, 255, 255, 0.7)" : "rgb(255, 255, 255)";
            ctx.fillText(dancer.name, 0, 0);
            if (isExample) {
                let center = width / 2 - ctx.measureText("Size").width;
                ctx.strokeText("Size", center, size);
                ctx.fillText("Size", center, size);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    addDancer() {
        saveState();
        let findSafe = (pt, formation, yOth = 1) => {
            let safe;
            do { //move to non-overlapping location
                safe = true;
                this.dancers.forEach(dancer => {
                    let pos = dancer.positions[formation];
                    if (this.inRadius(pt, pos, dancerRadius * 2)) {
                        safe = false;
                        pt.x += dancerRadius * (Math.random() < 0.5 ? -1 : 1);
                        pt.y += dancerRadius * (Math.random() < 0.5 ? -1 : yOth);
                    }
                });
            } while (!safe);
        };

        let currPt = this.ctx.transformedPoint(this.width / 2, this.height / 2);
        findSafe(currPt, timeline.curr);
        let pos = [];
        let grp = [];

        this.ctx.save();
        this.resetView();
        let otherPt = null;
        for (let i = 0; i < timeline.formations.length; i++) {
            if (i == timeline.curr) {
                pos.push({ x: currPt.x, y: currPt.y, angle: 0 });
                grp.push(this.groups.getActiveColor());
                continue;
            }
            if (otherPt == null) //try and keep it the same for all other slides if possible
                otherPt = this.ctx.transformedPoint(this.width / 2, dancerRadius);
            findSafe(otherPt, i, 0);
            pos.push({ x: otherPt.x, y: otherPt.y, angle: 0 });
            grp.push(-1);
        }
        this.ctx.restore();

        let dancer = { name: "name", positions: pos, groups: grp };
        this.dancers.push(dancer);
        this.selected = [dancer];
        dom.removeDancer.disabled = false;
        this.renaming = dancer;
        this.renamingStart = true;
        this.draw();
        timeline.resetThumbnails();
        dom.stageView.focus();
    }
    removeDancer() {
        if (this.selected.length > 0) {
            saveState();
            this.dancers = this.dancers.filter(dancer => this.selected.indexOf(dancer) === -1);
            this.selected = [];
            this.draw();
            timeline.resetThumbnails();
        }
        dom.removeDancer.disabled = true;
    }

    showGridPress() {
        this.showGrid = dom.showGrid.checked;
        if (!this.showGrid) {
            dom.snapToGrid.disabled = true;
            dom.gridScaleValue.disabled = true;
            dom.gridScaleUnits.disabled = true;
            dom.gridScaleDiv.classList.add("disabled");
            dom.snapToGridDiv.classList.add("disabled");
        } else {
            dom.snapToGrid.disabled = false;
            dom.gridScaleValue.disabled = false;
            dom.gridScaleUnits.disabled = false;
            dom.gridScaleDiv.classList.remove("disabled");
            dom.snapToGridDiv.classList.remove("disabled");
        }
        this.draw();
    }
    gridScaleChange() {
        let val = dom.gridScaleValue.value;
        if (isNaN(val) || val <= 0) {
            dom.gridScaleValue.classList.add("invalid");
            return;
        }
        dom.gridScaleValue.classList.remove("invalid");
        this.gridScale = val * dom.gridScaleUnits.value;
        this.draw();
    }
    snapToGridPress() { this.snapToGrid = dom.snapToGrid.checked; }
    showDancerSizePress() {
        this.showDancerSize = dom.showDancerSize.checked;
        this.draw();
    }

    doneDrawing() {
        dom.stageDrawing.style.display = "none";
        dom.stageDrawingControls.style.display = "none";
        dom.drawingInstruction.style.display = "none";
        dom.audience.style.display = "none";
        dom.editStage.style.display = "block";
        dom.stageView.classList.remove("drawing");
        this.drawingMode = false;
        this.showGrid = false;
        if (this.firstStageDraw) {
            this.resetView();
            this.firstStageDraw = false
        }
        timeline.resetThumbnails();
    }

    startDrawing() {
        dom.stageDrawing.style.display = "block";
        dom.stageDrawingControls.style.display = "grid";
        dom.drawingInstruction.style.display = "block";
        dom.audience.style.display = "flex";
        dom.editStage.style.display = "none";
        dom.stageView.classList.add("drawing");
        this.drawingMode = true;
        this.selected = [];
        this.showGridPress();
        this.draw();
    }

    /** Checks if a point should be snapped to grid */
    checkSnap(point) {
        if (!(this.showGrid && this.snapToGrid)) return point;
        let snap = {
            x: Math.round(point.x / this.gridScale) * this.gridScale,
            y: Math.round(point.y / this.gridScale) * this.gridScale
        }
        return this.inRadius(point, snap, distThreshold) ? snap : point;
    }

    mousedown(mouse, buttons, adding) {
        if (buttons === 1) saveState();
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        this.lastM = mouseT;
        this.dragged = false;
        this.renaming = null;
        this.renamingStart = false;
        if (buttons === 1) { //left click
            if (this.drawingMode) { //:::DRAWING
                let sPoint = this.checkSnap(this.lastM);

                let sBoxSize = (boxSize + boxSize / this.ctx.scaled.x) / 2;
                for (let i = 0; i < this.points.length; i++) { //Check if selecting a handle
                    let point = this.points[i];
                    if (this.inRadius(sPoint, point, sBoxSize) ||
                        this.inRadius(mouseT, point, sBoxSize)) {
                        if (i === 0 && this.points.length > 2 && !this.closed &&
                            this.currPoint === this.points.length - 1) {
                            this.closed = true;
                            dom.confirmStage.disabled = false;
                            this.currPoint = 0;
                            this.draw();
                        }
                        dom.stageView.classList.remove("drawing");
                        this.mdMoving = true;
                        this.currPoint = i;
                        return;
                    }
                }

                this.mdDrawing = true;
                if (this.points.length === 0) {
                    this.firstPoint = sPoint;
                    this.points.push(sPoint);
                } else {
                    let curr = this.points[this.currPoint];
                    let next = this.points[this.currPoint === this.points.length - 1 ?
                        0 : this.currPoint + 1];
                    let prev = this.points[this.currPoint === 0 ?
                        this.points.length - 1 : this.currPoint - 1];
                    let dirC = { x: sPoint.x - curr.x, y: sPoint.y - curr.y };
                    let dirN = { x: sPoint.x - next.x, y: sPoint.y - next.y };
                    let dirP = { x: sPoint.x - prev.x, y: sPoint.y - prev.y };
                    let dotNormal = (v1, v2) => {
                        return (v1.x * v2.x + v1.y * v2.y) /
                            (Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2));
                    };
                    if (this.closed && dotNormal(dirC, dirN) > dotNormal(dirC, dirP))
                        this.currPoint--; //add point in direction where mouse is
                    this.points.splice(++this.currPoint, 0, sPoint);
                }
                this.draw();

                return; //skip everything else
            }

            for (let i = this.selected.length - 1; i >= 0; i--) { //:::ROTATING
                let dancer = this.selected[i];
                let pos = dancer.positions[timeline.curr];
                this.ctx.save();
                this.ctx.translate(pos.x, pos.y);
                this.ctx.rotate(pos.angle);
                if (this.ctx.isPointInPath(dancer.rotateIcon, mouse.x, mouse.y)) {
                    this.rotating = dancer;
                    this.ctx.restore();
                    return;
                }
                this.ctx.restore();
            }
            for (let i = this.dancers.length - 1; i >= 0; i--) { //:::MOVING
                let dancer = this.dancers[i];
                let pos = dancer.positions[timeline.curr];
                if (this.inRadius(mouseT, pos, dancerRadius)) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected.indexOf(dancer) === -1 && !adding) this.selected = [];
                    this.dragging = dancer;
                    this.draw();
                    return;
                }
            }
            //No dancer was clicked on, so start box select:
            if (!adding)
                this.selected = [];
            this.selP1 = mouseT;
        } else {//other click, probably right or middle :::PANNING/ZOOMING
            this.pageDrag = this.lastM;
        }
    }

    mousemove(mouse) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (this.lastM != null && Math.abs(this.lastM.x - mouseT.x) < 0.01 &&
            Math.abs(this.lastM.y - mouseT.y) < 0.01)
            return; //For some reason mousemove is being called on mousedown even when no movement???

        if (this.pageDrag != null) { //:::PANNING/ZOOMING
            this.ctx.translate(mouseT.x - this.pageDrag.x, mouseT.y - this.pageDrag.y);
            dom.stageViewControls.style.display = "none";
            this.draw();
            return;
        }

        if (this.drawingMode) { //:::DRAWING
            this.lastM = mouseT;
            let sPoint = this.checkSnap(this.lastM);
            if (this.mdDrawing || this.mdMoving) {
                dom.stageViewControls.style.display = "none";
                this.points[this.currPoint] = sPoint;
                if (this.points.length === 1 || this.currPoint === 0) this.firstPoint = sPoint;
                this.draw();
                return; //skip everything else
            } else {
                let sBoxSize = (boxSize + boxSize / this.ctx.scaled.x) / 2;
                dom.stageView.classList.add("drawing");
                this.points.forEach(point => {
                    if (this.inRadius(mouseT, point, sBoxSize) &&
                        (this.closed || this.points.length <= 2 ||
                            point !== this.firstPoint || this.currPoint !== this.points.length - 1))
                        dom.stageView.classList.remove("drawing");
                });
            }
        }

        this.dragged = true;
        if (this.dragging != null) { //:::MOVING
            let pos = this.dragging.positions[timeline.curr];
            pos.x += mouseT.x - this.lastM.x;
            pos.y += mouseT.y - this.lastM.y;
            this.selected.forEach(dancer => {
                let posOther = dancer.positions[timeline.curr];
                if (dancer != this.dragging) {
                    posOther.x += mouseT.x - this.lastM.x;
                    posOther.y += mouseT.y - this.lastM.y;
                }
            });
            dom.stageViewControls.style.display = "none";
            this.draw();
        } else if (this.rotating != null) { //:::ROTATING
            let pos = this.rotating.positions[timeline.curr];
            let oldA = pos.angle;
            let moveX = mouseT.x - pos.x;
            let moveY = mouseT.y - pos.y;
            let dotNormal = moveY / Math.sqrt(moveX ** 2 + moveY ** 2);
            let dir = mouseT.x < pos.x ? 1 : -1;
            pos.angle = Math.acos(dotNormal) * dir;
            this.selected.forEach(dancer => {
                let posOther = dancer.positions[timeline.curr];
                if (dancer != this.rotating) posOther.angle += pos.angle - oldA;
            });
            dom.stageViewControls.style.display = "none";
            this.draw();
        } else if (this.selP1 != null) { //:::BOX SELECT
            this.selP2 = mouseT;
            dom.stageViewControls.style.display = "none";
            this.draw();
        }
        let setHovering = false;
        for (let i = this.dancers.length - 1; i >= 0; i--) { //:::HOVERING
            let dancer = this.dancers[i];
            let pos = dancer.positions[timeline.curr];
            if ((pos.x - mouseT.x) ** 2 + (pos.y - mouseT.y) ** 2 < (dancerRadius) ** 2) {
                this.moveDancerToEnd(dancer, i,
                    this.selected.indexOf(dancer) === -1 ? this.selected.length + 1 : 1);
                this.hovering = dancer;
                setHovering = true;
                this.draw();
                break;
            }
        }
        if (!setHovering && this.hovering !== null) {
            this.hovering = null;
            this.draw();
        }
        this.lastM = mouseT;
    }
    mouseup() {
        if (!this.isDragging()) return;
        this.mdDrawing = false;
        this.mdMoving = false;
        this.dragging = null;
        this.rotating = null;
        this.pageDrag = null;
        if (this.selP1 != null && this.selP2 != null) {
            this.selected = this.dancers.filter(dancer => {
                let pos = dancer.positions[timeline.curr];
                let danceT = this.ctx.untransformedPoint(pos.x, pos.y);
                if (this.ctx.isPointInPath(this.selectionBox, danceT.x, danceT.y)) {
                    this.setColor(dancer);
                    return true;
                }
                return false;
            });
            let n = 1;
            this.selected.forEach(dancer => {
                this.moveDancerToEnd(dancer, this.dancers.indexOf(dancer), n);
                n++;
            });
        }
        this.selP1 = null;
        this.selP2 = null;
        dom.stageViewControls.style.display = "flex";
        dom.removeDancer.disabled = this.selected.length === 0;
        this.draw();
    }
    mouseenter(buttons) {
        if (!this.isDragging()) return;
        if (buttons != 1) this.mouseup();
    }
    click(mouse, adding) {
        if (this.dragged || this.drawingMode) return;
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (!adding)
            this.selected = [];
        for (let i = this.dancers.length - 1; i >= 0; i--) {
            let dancer = this.dancers[i];
            let pos = dancer.positions[timeline.curr];
            if ((pos.x - mouseT.x) ** 2 + (pos.y - mouseT.y) ** 2 < (dancerRadius) ** 2) {
                let ind = this.selected.indexOf(dancer);
                if (adding && ind !== -1) {
                    this.selected.splice(ind, 1);
                } else {
                    this.selected.push(dancer);
                }
                this.setColor(dancer);
                this.rotating = null;
                this.dragging = null;
                this.moveDancerToEnd(dancer, i);
                dom.removeDancer.disabled = this.selected.length === 0;
                this.draw();
                return;
            }
        }
        this.draw();
        dom.removeDancer.disabled = this.selected.length === 0;
    }
    setColor(dancer) {
        if (this.groups.getActiveColor() !== -1) {
            if (dancer.groups[timeline.curr] === this.groups.getActiveColor()) {
                dancer.groups[timeline.curr] = -1;
            }
            else {
                dancer.groups[timeline.curr] = this.groups.getActiveColor();
            }
        }
    }

    /** Moves the specified dancer to the end of the dancers array.
     * @param {*} dancer the dancer to move
     * @param {*} i the index of that dancer
     * @param {*} n distance from end to move dancer */
    moveDancerToEnd(dancer, i, n = 1) {
        let temp = this.dancers[this.dancers.length - n] //swap to make selected on top
        this.dancers[this.dancers.length - n] = dancer;
        this.dancers[i] = temp;
    }
    /** Returns whether or not anything is currently being dragged */
    isDragging() {
        return this.dragging != null || this.rotating != null || this.pageDrag != null ||
            this.selP1 != null || this.mdDrawing || this.mdMoving;
    }

    dblclick(mouse) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        for (let i = this.dancers.length - 1; i >= 0; i--) {
            let dancer = this.dancers[i];
            let pos = dancer.positions[timeline.curr];
            if ((pos.x - mouseT.x) ** 2 + (pos.y - mouseT.y) ** 2 < (dancerRadius) ** 2) {
                this.renaming = dancer;
                this.renamingStart = true;
                this.rotating = null;
                this.dragging = null;
                this.moveDancerToEnd(dancer, i);
                this.draw();
                return;
            }
        }
    }
    keypress(evt) {
        if (this.renaming !== null) {
            if (evt.keyCode === 13) { //Enter
                this.renaming = null;
                this.renamingStart = false;
                this.draw();
                return;
            }
            if (this.renamingStart) {
                this.renaming.name = evt.key;
                this.renamingStart = false;
            } else {
                this.renaming.name += evt.key;
            }
            this.draw();
        }
    }
    keydown(evt) {
        if (this.drawingMode) {
            if (evt.keyCode === 46 || evt.keyCode === 8) { //:::DELETE POINT (Del or Backspace)
                if (this.points.length === 0) return;
                saveState();
                let next = this.points[this.currPoint === this.points.length - 1 ?
                    0 : this.currPoint + 1];
                let prev = this.points[this.currPoint === 0 ?
                    this.points.length - 1 : this.currPoint - 1];
                if (Math.abs(next.x - this.lastM.x) ** 2 + Math.abs(next.y - this.lastM.y) ** 2 >
                    Math.abs(prev.x - this.lastM.x) ** 2 + Math.abs(prev.y - this.lastM.y) ** 2)
                    this.points.splice(this.currPoint--, 1);
                else
                    this.points.splice(this.currPoint, 1);

                if (this.points.length <= 2 && this.closed) {
                    this.closed = false;
                    dom.confirmStage.disabled = true;
                }

                if (this.currPoint >= this.points.length)
                    this.currPoint = this.closed ? 0 : this.points.length - 1;
                if (this.currPoint < 0)
                    this.currPoint = this.closed ? this.points.length - 1 : 0;

                this.firstPoint = this.points.length > 0 ? this.points[0] : null;
                this.draw();
            }
        }
        if (this.renaming !== null && evt.ctrlKey === false && evt.shiftKey === false) {
            if (evt.keyCode === 8) { //Backspace
                if (this.renamingStart) {
                    this.renaming.name = "";
                    this.renamingStart = false;
                } else {
                    this.renaming.name = this.renaming.name.substring(0, this.renaming.name.length - 1);
                }
                this.draw();
                return evt.preventDefault() && false;
            } else if (evt.keyCode === 37 || evt.keyCode === 39 && this.renamingStart) { //left and right
                this.renamingStart = false;
                this.draw();
                return evt.preventDefault() && false;
            }
        }
        if (evt.keyCode === 46) { //Del
            this.removeDancer();
        }
    }
    mousedownOutside() {
        if (this.renaming === null) return;
        this.renaming = null;
        this.renamingStart = false;
        this.draw();
    }

    mousewheel(evt, mouse) {
        let delta = evt.wheelDelta ? evt.wheelDelta / 40 : (evt.detail ? -evt.detail : 0);
        if (delta) this.zoom(delta, this.ctx.transformedPoint(mouse.x, mouse.y));
    }
    /** Zoom the canvas in, centered on a point.
     * @param {number} clicks how far to zoom in
     * @param point the center point of the zoom */
    zoom(clicks, point) {
        this.ctx.translate(point.x, point.y);
        let factor = Math.pow(1.1, clicks);
        this.ctx.scale(factor, factor);
        this.ctx.translate(-point.x, -point.y);
        this.draw();
    }

    /** Zooms the canvas in our out.
     * @param {*} frames how many frames to zoom for
     * @param {*} clicksPerFrame how far to zoom per frame */
    zoomAnim(frames, clicksPerFrame) {
        requestAnimationFrame(() => {
            this.zoom(clicksPerFrame, this.ctx.transformedPoint(this.width / 2, this.height / 2));
            if (frames > 0) this.zoomAnim(frames - 1, clicksPerFrame * 0.7);
        });
    }
    /** Resets the view of the canvas back to its initial settings */
    resetView(ctx = this.ctx, width = this.width, height = this.height) {
        ctx.resetTransform(); //Set to defaults
        this.checkBounds();
        if (this.stage != null && this.closed) {
            let sWidth = this.bounds.maxX - this.bounds.minX;
            let sHeight = this.bounds.maxY - this.bounds.minY;
            ctx.translate((width - sWidth) / 2 - this.bounds.minX, (height - sHeight) / 2 - this.bounds.minY);

            let zoomScalar = Math.min(width / sWidth, height / sHeight) * 0.9;
            let center = ctx.transformedPoint(width / 2, height / 2);
            ctx.translate(center.x, center.y);
            ctx.scale(zoomScalar, zoomScalar);
            ctx.translate(-center.x, -center.y);
        }
        this.draw();
    }

    /** Checks all the points and sets the bounds of the stage based on it */
    checkBounds(point) {
        this.bounds = { //start it so that it will definitely set all four values
            minX: Number.MAX_SAFE_INTEGER, maxX: -Number.MAX_SAFE_INTEGER,
            minY: Number.MAX_SAFE_INTEGER, maxY: -Number.MAX_SAFE_INTEGER
        };
        this.points.forEach(point => {
            if (point.x < this.bounds.minX) this.bounds.minX = point.x;
            if (point.y < this.bounds.minY) this.bounds.minY = point.y;
            if (point.x > this.bounds.maxX) this.bounds.maxX = point.x;
            if (point.y > this.bounds.maxY) this.bounds.maxY = point.y;
        });
    }

    /** Uses this canvas to measure some text for you thank you very much */
    measureText(fontFamily, fontSize, fontWeight, text) {
        this.ctx.font = `normal normal ${fontWeight} ${fontSize} ${fontFamily}`;
        return this.ctx.measureText(text).width;
    }

    /** Returns true iff point pt is within radius of point center */
    inRadius(pt, center, radius) {
        return Math.abs(pt.x - center.x) ** 2 + Math.abs(pt.y - center.y) ** 2 < radius ** 2;
    }
}