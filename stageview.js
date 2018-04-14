//TODO Zoom min and max
//TODO Undo/Redo
//TODO Front view
//TODO Showing and editing names
/** Implements the top and front stage views, with adding and removing dancers */
class StageView extends EventTarget {
    constructor() {
        super();
        this.ctx = null; //initialized in main.js
        this.width = null; //initialized in respondCanvas()
        this.height = null; //^
        this.dancerSize = 40;
        this.scaleFactor = 1.1;
        this.pageDrag = null; //dragging page
        this.dragging = null; //dragged dancer
        this.rotating = null; //rotating dancer
        this.selectP1 = null; //Start point of box selection
        this.selectP2 = null; //End point of box selection
        this.selectionBox = null; //The actual box, for hitTesting
        this.selected = []; //selected dancers
        this.dancers = []; //element format: {name: "name", x: 5.6, y: 20, angle: 37}
        this.formations = [this.dancers]; //a list of dancers
        //---TESTING---
        this.dancers.push({ name: "name", x: 0, y: 0 });
        this.dancers.push({ name: "name", x: 500, y: 0 });
        this.dancers.push({ name: "name", x: 1000, y: 0 });
        this.dancers.push({ name: "name", x: 0, y: 500 });
        this.dancers.push({ name: "name", x: 500, y: 500 });
        this.dancers.push({ name: "name", x: 1000, y: 500 });
        this.dancers.push({ name: "name", x: 0, y: 1000 });
        this.dancers.push({ name: "name", x: 500, y: 1000 });
        this.dancers.push({ name: "name", x: 1000, y: 1000 });
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
            this.ctx.translate(newC.x - oldC.x, newC.y - oldC.y); //FIXME
        }
        this.draw();
    }

    /** Draw the stage, dancers, etc. */
    draw() {
        let p1 = this.ctx.transformedPoint(0, 0);
        let p2 = this.ctx.transformedPoint(this.width, this.height);
        this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.restore();

        this.dancers.forEach(dancer => {
            if (this.dragging == dancer) {
                this.ctx.shadowBlur = 20;
                if (this.selected.indexOf(dancer) == -1)
                    this.ctx.shadowColor = "black";
                else
                    this.ctx.shadowColor = 'rgb(0, 56, 147)';
            } else if (this.selected.indexOf(dancer) != -1) {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = "blue";
            } else {
                this.ctx.shadowBlur = 0;
            }
            //:::MAIN CIRCLE
            this.ctx.fillStyle = 'rgb(60, 60, 60)';
            this.ctx.beginPath();
            this.ctx.arc(dancer.x, dancer.y, this.dancerSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgb(200, 200, 200)';
            this.ctx.stroke();

            ///:::DRAG HANDLE

            this.ctx.save();
            this.ctx.translate(dancer.x, dancer.y);
            this.ctx.rotate(dancer.angle);

            this.ctx.fillStyle = 'rgb(140, 140, 140)';
            dancer.dirArrow = new Path2D();
            dancer.dirArrow.arc(0, 0, this.dancerSize, 0, Math.PI);
            // dancer.dirArrow.moveTo(this.dancerSize, 0);
            dancer.dirArrow.bezierCurveTo(-this.dancerSize * .4, this.dancerSize * .55,
                this.dancerSize * .4, this.dancerSize * .55, this.dancerSize, 0);
            // dancer.dirArrow.closePath();
            this.ctx.fill(dancer.dirArrow);
            this.ctx.strokeStyle = 'rgb(20, 20, 20)';
            this.ctx.stroke(dancer.dirArrow);

            //::EYES
            this.ctx.fillStyle = 'rgb(250, 250, 250)';
            this.ctx.beginPath();
            this.ctx.arc(this.dancerSize * .45, this.dancerSize * .6, this.dancerSize / 5, 0, Math.PI * 2);
            this.ctx.arc(-this.dancerSize * .45, this.dancerSize * .6, this.dancerSize / 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgb(0, 0, 0)';
            this.ctx.beginPath();
            this.ctx.arc(this.dancerSize * .45, this.dancerSize * .65, this.dancerSize / 10, 0, Math.PI * 2);
            this.ctx.arc(-this.dancerSize * .45, this.dancerSize * .65, this.dancerSize / 10, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });

        //:::BOX SELECT
        if (this.selectP1 != null && this.selectP2 != null) {
            this.selectionBox = new Path2D();
            this.selectionBox.rect(this.selectP1.x, this.selectP1.y, this.selectP2.x - this.selectP1.x, this.selectP2.y - this.selectP1.y);
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
            this.dancers = this.dancers.filter(dancer => this.selected.indexOf(dancer) == -1);
            this.draw();
        }
    }

    mousedown(mouse, buttons) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        this.lastM = mouseT;
        if (buttons == 1) { //left click
            for (let i = this.dancers.length - 1; i >= 0; i--) { //backwards so selected is chosen first
                let dancer = this.dancers[i];
                this.oldM = mouseT;

                this.ctx.save();
                this.ctx.translate(dancer.x, dancer.y);
                this.ctx.rotate(dancer.angle);
                if (this.ctx.isPointInPath(dancer.dirArrow, mouse.x, mouse.y)) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected.indexOf(dancer) == -1) this.selected = [];
                    this.rotating = dancer;
                    this.ctx.restore();
                    return;
                }
                this.ctx.restore();

                if ((dancer.x - mouseT.x) ** 2 + (dancer.y - mouseT.y) ** 2 < (this.dancerSize) ** 2) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected.indexOf(dancer) == -1) this.selected = [];
                    this.dragging = dancer;
                    this.draw();
                    return;
                }
            }
            //No dancer was clicked on, so start box select:
            this.selected = [];
            this.selectP1 = mouseT;
        } else {//other click, probably right or middle
            this.pageDrag = this.lastM;
        }
    }
    mousemove(mouse) {
        let mouseT = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (this.dragging != null) {
            this.dragging.x += mouseT.x - this.lastM.x;
            this.dragging.y += mouseT.y - this.lastM.y;
            this.selected.forEach(dancer => {
                if (dancer != this.dragging) {
                    dancer.x += mouseT.x - this.lastM.x;
                    dancer.y += mouseT.y - this.lastM.y;
                }
            });
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
            this.draw();
        } else if (this.selectP1 != null) {
            this.selectP2 = mouseT;
            this.draw();
        } else if (this.pageDrag != null) {
            this.ctx.translate(mouseT.x - this.pageDrag.x, mouseT.y - this.pageDrag.y);
            this.draw();
        }
        this.lastM = mouseT;
    }
    mouseup() {
        if (this.dragging == null && this.rotating == null && this.pageDrag == null && this.selectP1 == null) return;
        this.dragging = null;
        this.rotating = null;
        this.pageDrag = null;
        if (this.selectP1 != null) {
            this.selected = this.dancers.filter(dancer => {
                let danceT = this.ctx.untransformedPoint(dancer.x, dancer.y);
                return this.ctx.isPointInPath(this.selectionBox, danceT.x, danceT.y);
            });
            this.selectP1 = null;
            this.selectP2 = null;
        }
        this.draw();
    }
    mouseenter(buttons) {
        if (this.dragging == null && this.rotating == null && this.pageDrag == null && this.selectP1 == null) return;
        if (buttons != 1) this.mouseup();
    }
    mouseclick(mouse) {
        mouse = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (Math.abs(this.oldM.x - mouse.x) + Math.abs(this.oldM.y - mouse.y) > 0.001)
            return; //clicked, but then dragged too far
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
                return;
            }
        }
        this.draw();
    }
    moveDancerToEnd(dancer, i) {
        let temp = this.dancers[this.dancers.length - 1] //swap to make selected on top
        this.dancers[this.dancers.length - 1] = dancer;
        this.dancers[i] = temp;
    }

    handleScroll(evt) {
        let delta = evt.wheelDelta ? evt.wheelDelta / 40 : (evt.detail ? -evt.detail : 0);
        if (delta) this.zoom(delta, this.lastM);
    }
    /** Zoom the canvas in, centered on a point.
     * @param {number} clicks how far to zoom in
     * @param point the center point of the zoom */
    zoom(clicks, point) {
        this.ctx.translate(point.x, point.y);
        let factor = Math.pow(this.scaleFactor, clicks);
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
    resetView() {
        this.ctx.setTransform();
        this.draw();
    }
}