//TODO: Zoom min and max
//TODO: Undo/Redo
//TODO: Front view
//TODO: Showing and editing names
//TODO: CTRL/Shift for selecting multiple, del for removing dancer


/** Implements the top and front stage views, with adding and removing dancers */
class StageView extends EventTarget {
    constructor() {
        super();
        this.ctx = null; //initialized in main.js
        this.width = null; //initialized in respondCanvas()
        this.height = null; //^
        this.dancerSize = 20; //radius of dancer, in centimeters
        this.pageDrag = null; //dragging page
        this.dragging = null; //dragged dancer
        this.rotating = null; //rotating dancer
        this.selP1 = null; //Start point of box selection
        this.selP2 = null; //End point of box selection
        this.selectionBox = null; //The actual box, for hitTesting
        this.selected = []; //selected dancers
        this.dancers = []; //element format: {name: "name", x: 5.6, y: 20, angle: 37}

        this.formations = [this.dancers]; //a list of dancers
        this.selectedFormation = 1;
        this.selectedFormationCtx = null;
        this.redrawThumb = false; //should the formation thumbnail be redrawn?

        this.stage = null;
        this.stageBounds = { maxX: 0, maxY: 0 }; //unconverted pixel size of stage (mins are both 0)
        this.stageWidth = 0; //estimation of real stage width, in centimeters

        window.setInterval(() => {
            if (this.selectedFormationCtx != null && this.redrawThumb) {
                this.draw(this.selectedFormationCtx);
                this.redrawThumb = false;
            }
        }, 1000);

        //---TESTING---
        let sW = 100;
        let sH = 70;
        this.stage = new Path2D();
        this.stage.moveTo(0, 0);
        this.stage.lineTo(0, sH * 2 / 3);
        this.stage.lineTo(sW / 3, sH);
        this.stage.lineTo(sW * 2 / 3, sH);
        this.stage.lineTo(sW, sH * 2 / 3);
        this.stage.lineTo(sW, 0);
        this.stage.closePath();
        this.stageBounds = { maxX: sW, maxY: sH };
        this.stageWidth = 500;

        // this.dancers.push({ name: "name", x: 0, y: 0, angle: 0 });
        // this.dancers.push({ name: "name", x: 500, y: 0, angle: 0 });
        // this.dancers.push({ name: "name", x: 1000, y: 0, angle: 0 });
        // this.dancers.push({ name: "name", x: 0, y: 500, angle: 0 });
        // this.dancers.push({ name: "name", x: 500, y: 500, angle: 0 });
        // this.dancers.push({ name: "name", x: 1000, y: 500, angle: 0 });
        // this.dancers.push({ name: "name", x: 0, y: 1000, angle: 0 });
        // this.dancers.push({ name: "name", x: 500, y: 1000, angle: 0 });
        // this.dancers.push({ name: "name", x: 1000, y: 1000, angle: 0 });
        // let scalar = this.stageWidth / sW;
        // let cent = { name: "Center", x: sW * scalar / 2, y: sH * scalar / 2, angle: 0 };
        // this.dancers.push(cent);
        // this.selected.push(cent);
    }

    /** Respond to window resize so that drawings don't get distorted. */
    respondCanvas(firstTime = false) {
        let oldC = this.ctx.transformedPoint(this.width / 2, this.height / 2);
        let oldT = this.ctx.getTransform();
        this.ctx.setTransform();
        this.width = parseInt(Util.getStyleValue(dom.stageView, "width"));
        this.height = parseInt(Util.getStyleValue(dom.stageView, "height"));
        dom.stageView.setAttribute("width", this.width);
        dom.stageView.setAttribute("height", this.height);
        if (!firstTime) {
            this.ctx.transform(oldT.a, oldT.b, oldT.c, oldT.d, oldT.e, oldT.f);
            let newC = this.ctx.transformedPoint(this.width / 2, this.height / 2);
            this.ctx.translate(newC.x - oldC.x, newC.y - oldC.y);
        } else {
            this.resetView();
        }
        this.draw();
    }

    /** Draw the stage, dancers, etc. */
    draw(ctx = this.ctx) {
        if (ctx === this.ctx)
            this.redrawThumb = true;
        else {
            ctx.setTransform();
            this.resetView(ctx, parseInt(Util.getStyleValue(ctx.canvas, "width")),
                parseInt(Util.getStyleValue(ctx.canvas, "height")));
        }
        let p1 = ctx.transformedPoint(0, 0);
        let p2 = ctx.transformedPoint(this.width, this.height);
        ctx.fillStyle = 'rgb(200, 200, 200)';
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        //:::STAGE
        if (this.stage != null) {
            ctx.save();
            let scalar = this.stageWidth / this.stageBounds.maxX;
            ctx.scale(scalar, scalar);

            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.fillStyle = 'rgb(255, 250, 240)';
            ctx.fill(this.stage);

            ctx.restore();
        }

        //:::DANCERS
        this.dancers.forEach(dancer => {
            let r = this.dancerSize;

            //:::MAIN CIRCLE
            if (this.dragging === dancer && ctx === this.ctx) {
                ctx.shadowBlur = 20;
                if (this.selected.indexOf(dancer) === -1)
                    ctx.shadowColor = "black";
                else
                    ctx.shadowColor = 'rgb(0, 56, 147)';
            } else if (this.selected.indexOf(dancer) != -1 && ctx === this.ctx) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = "blue";
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = 'rgb(60, 60, 60)';
            ctx.beginPath();
            ctx.arc(dancer.x, dancer.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgb(200, 200, 200)';
            ctx.stroke();

            ///:::FACE
            ctx.save();
            ctx.translate(dancer.x, dancer.y);
            ctx.rotate(dancer.angle);

            ctx.fillStyle = 'rgb(140, 140, 140)';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI);
            ctx.bezierCurveTo(-r * .4, r * .55,
                r * .4, r * .55, r, 0);
            ctx.fill();
            ctx.strokeStyle = 'rgb(20, 20, 20)';
            ctx.stroke();

            //::EYES
            ctx.fillStyle = 'rgb(250, 250, 250)';
            ctx.beginPath();
            ctx.arc(r * .45, r * .6, r / 5, 0, Math.PI * 2);
            ctx.arc(-r * .45, r * .6, r / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.beginPath();
            ctx.arc(r * .45, r * .65, r / 10, 0, Math.PI * 2);
            ctx.arc(-r * .45, r * .65, r / 10, 0, Math.PI * 2);
            ctx.fill();

            //::DRAG HANDLE
            if (this.selected.indexOf(dancer) != -1 && ctx === this.ctx) {
                ctx.beginPath();
                ctx.arc(0, r * 1.6, r * .4, 0, (9.8 / 6) * Math.PI);
                ctx.arc(0, r * 1.6, r * .4 * 0.5, (9.5 / 6) * Math.PI, 0.04 * Math.PI, true);
                ctx.lineTo(r * 0.05, r * 1.65);
                ctx.lineTo(r * 0.24, r * 1.37);
                ctx.lineTo(r * 0.54, r * 1.58);
                ctx.closePath();
                ctx.fillStyle = 'rgb(0, 0, 0)';
                ctx.fill();

                dancer.rotateIcon = new Path2D(); //bounding box to make clicking easier
                dancer.rotateIcon.moveTo(-r * 0.5, r * 1.1);
                dancer.rotateIcon.lineTo(r * 0.5, r * 1.1);
                dancer.rotateIcon.lineTo(r * 0.5, r * 2.1);
                dancer.rotateIcon.lineTo(-r * 0.5, r * 2.1);
                dancer.rotateIcon.closePath();
                // ctx.strokeStyle = 'rgb(0, 0, 0)';
                // ctx.stroke(dancer.rotateIcon);
            }

            ctx.restore();
        });

        //:::BOX SELECT
        if (this.selP1 != null && this.selP2 != null && ctx === this.ctx) {
            this.selectionBox = new Path2D();
            this.selectionBox.rect(this.selP1.x, this.selP1.y,
                this.selP2.x - this.selP1.x, this.selP2.y - this.selP1.y);
            this.ctx.fillStyle = 'rgba(130, 166, 255, .5)';
            this.ctx.fill(this.selectionBox);
            this.ctx.strokeStyle = 'rgb(130, 166, 255)';
            this.ctx.stroke(this.selectionBox);
        }
    }

    addDancer() {
        let pt = this.ctx.transformedPoint(this.width / 2, this.height / 2);
        let safe = true;
        do { //move to non-overlapping location
            safe = true;
            this.dancers.forEach(dancer => {
                if ((dancer.x - pt.x) ** 2 + (dancer.y - pt.y) ** 2 < (this.dancerSize * 2) ** 2) {
                    safe = false;
                    pt.x += this.dancerSize * (Math.random() < 0.5 ? -1 : 1);
                    pt.y += this.dancerSize * (Math.random() < 0.5 ? -1 : 1);
                }
            });
        } while (!safe);
        this.dancers.push({ name: "name", x: pt.x, y: pt.y, angle: 0 });
        this.draw();
    }
    removeDancer() {
        //TODO should have a dialogue box asking if to delete from this formation, all before, all after, or all (options based on position and number of formations)
        if (this.selected.length > 0) {
            this.dancers = this.dancers.filter(dancer => this.selected.indexOf(dancer) === -1);
            this.draw();
        }
        dom.removeDancer.disabled = true;
    }

    mousedown(mouse, buttons) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        this.lastM = mouseT;
        this.dragged = false;
        if (buttons === 1) { //left click
            for (let i = this.dancers.length - 1; i >= 0; i--) { //backwards so selected is chosen first
                let dancer = this.dancers[i];
                if (this.selected.indexOf(dancer) != -1) {
                    this.ctx.save();
                    this.ctx.translate(dancer.x, dancer.y);
                    this.ctx.rotate(dancer.angle);
                    if (this.ctx.isPointInPath(dancer.rotateIcon, mouse.x, mouse.y)) {
                        this.moveDancerToEnd(dancer, i);
                        if (this.selected.indexOf(dancer) === -1) this.selected = [];
                        this.rotating = dancer;
                        this.ctx.restore();
                        return;
                    }
                    this.ctx.restore();
                }

                if ((dancer.x - mouseT.x) ** 2 + (dancer.y - mouseT.y) ** 2 < (this.dancerSize) ** 2) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected.indexOf(dancer) === -1) this.selected = [];
                    this.dragging = dancer;
                    this.draw();
                    return;
                }
            }
            //No dancer was clicked on, so start box select:
            this.selected = [];
            this.selP1 = mouseT;
        } else {//other click, probably right or middle
            this.pageDrag = this.lastM;
        }
    }
    mousemove(mouse) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        this.dragged = true;
        if (this.dragging != null) {
            this.dragging.x += mouseT.x - this.lastM.x;
            this.dragging.y += mouseT.y - this.lastM.y;
            this.selected.forEach(dancer => {
                if (dancer != this.dragging) {
                    dancer.x += mouseT.x - this.lastM.x;
                    dancer.y += mouseT.y - this.lastM.y;
                }
            });
            dom.stageViewControls.style.display = "none";
            this.draw();
        } else if (this.rotating != null) {
            let oldA = this.rotating.angle;
            let moveX = mouseT.x - this.rotating.x;
            let moveY = mouseT.y - this.rotating.y;
            let dotNormal = moveY / Math.sqrt(moveX ** 2 + moveY ** 2);
            let dir = mouseT.x < this.rotating.x ? 1 : -1;
            this.rotating.angle = Math.acos(dotNormal) * dir;
            this.selected.forEach(dancer => {
                if (dancer != this.rotating) dancer.angle += this.rotating.angle - oldA;
            });
            dom.stageViewControls.style.display = "none";
            this.draw();
        } else if (this.selP1 != null) {
            this.selP2 = mouseT;
            dom.stageViewControls.style.display = "none";
            this.draw();
        } else if (this.pageDrag != null) {
            this.ctx.translate(mouseT.x - this.pageDrag.x, mouseT.y - this.pageDrag.y);
            dom.stageViewControls.style.display = "none";
            this.draw();
        }
        this.lastM = mouseT;
    }
    mouseup() {
        if (!this.isDragging()) return;
        this.dragging = null;
        this.rotating = null;
        this.pageDrag = null;
        if (this.selP1 != null && this.selP2 != null) {
            this.selected = this.dancers.filter(dancer => {
                let danceT = this.ctx.untransformedPoint(dancer.x, dancer.y);
                return this.ctx.isPointInPath(this.selectionBox, danceT.x, danceT.y);
            });
            let n = 1;
            this.selected.forEach(dancer => {
                this.moveDancerToEnd(dancer, this.dancers.indexOf(dancer), n);
                n++;
            });
        }
        this.selP1 = null;
        this.selP2 = null;
        dom.stageViewControls.style.display = "inline";
        dom.removeDancer.disabled = this.selected.length === 0;
        this.draw();
    }
    mouseenter(buttons) {
        if (!this.isDragging()) return;
        if (buttons != 1) this.mouseup();
    }
    mouseclick(mouse) {
        if (this.dragged) return; //clicked, but then dragged
        mouse = this.ctx.transformedPoint(mouse.x, mouse.y);
        this.selected = [];
        //forwards so that if overlapped, non-selected will be selected
        for (let i = 0; i < this.dancers.length; i++) {
            let dancer = this.dancers[i];
            if ((dancer.x - mouse.x) ** 2 + (dancer.y - mouse.y) ** 2 < (this.dancerSize) ** 2) {
                this.selected.push(dancer);
                this.rotating = null;
                this.dragging = null;
                this.moveDancerToEnd(dancer, i);
                this.draw();
                dom.removeDancer.disabled = this.selected.length === 0;
                return;
            }
        }
        this.draw();
        dom.removeDancer.disabled = this.selected.length === 0;
    }
    /** Moves the specified dancer to the end of the dancers array.
     * @param {*} dancer the dancer to move
     * @param {*} i the index of that dancer
     * @param {*} n should be incremented to 1 + the number of swapped dancers */
    moveDancerToEnd(dancer, i, n = 1) {
        let temp = this.dancers[this.dancers.length - n] //swap to make selected on top
        this.dancers[this.dancers.length - n] = dancer;
        this.dancers[i] = temp;
    }
    /** Returns whether or not anything is currently being dragged */
    isDragging() {
        return this.dragging != null || this.rotating != null || this.pageDrag != null || this.selP1 != null;
    }

    mousewheel(evt) {
        let delta = evt.wheelDelta ? evt.wheelDelta / 40 : (evt.detail ? -evt.detail : 0);
        if (delta) this.zoom(delta, this.lastM);
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
            clicksPerFrame *= .7;
            if (frames > 0) this.zoomAnim(frames - 1, clicksPerFrame);
        });
    }
    resetView(ctx = this.ctx, width = this.width, height = this.height) {
        ctx.setTransform(); //Set to defaults
        if (this.stage != null) {
            let scalar = this.stageWidth / this.stageBounds.maxX;
            let sWidth = this.stageBounds.maxX * scalar;
            let sHeight = this.stageBounds.maxY * scalar;
            ctx.translate((width - sWidth) / 2, (height - sHeight) / 2);
            let zoomScalar = Math.min(width / sWidth, height / sHeight) * 0.9;
            let center = ctx.transformedPoint(width / 2, height / 2);
            ctx.translate(center.x, center.y);
            ctx.scale(zoomScalar, zoomScalar);
            ctx.translate(-center.x, -center.y);
        }
        this.draw();
    }
}