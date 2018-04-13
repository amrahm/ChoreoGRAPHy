//TODO Marqee selection. Shouldn't be too hard, but will have to make dragging and selected be arrays
//TODO Zoom min and max
//TODO Zoom in, out, and reset view buttons
//TODO Undo/Redo
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
        this.selected = null; //selected dancer
        this.dancers = [] //element format: {name: "name", x: 5.6, y: 20, angle: 37}
        //---TESTING---
        // this.dancers.push({ name: "name", x: 0, y: 0 });
        // this.dancers.push({ name: "name", x: 500, y: 0 });
        // this.dancers.push({ name: "name", x: 1000, y: 0 });
        // this.dancers.push({ name: "name", x: 0, y: 500 });
        // this.dancers.push({ name: "name", x: 500, y: 500 });
        // this.dancers.push({ name: "name", x: 1000, y: 500 });
        // this.dancers.push({ name: "name", x: 0, y: 1000 });
        // this.dancers.push({ name: "name", x: 500, y: 1000 });
        // this.dancers.push({ name: "name", x: 1000, y: 1000 });
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
            if (dancer == this.dragging) {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = "black";
            } else if (dancer == this.selected) {
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
        if (this.selected != null) {
            this.dancers = this.dancers.filter(dancer => dancer != this.selected);
            this.draw();
        }
    }

    mousedown(mouse, buttons) {
        this.lastX = mouse.x;
        this.lastY = mouse.y;
        mouse = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (buttons == 1) { //left click
            for (let i = this.dancers.length - 1; i >= 0; i--) { //backwards so selected is chosen first
                let dancer = this.dancers[i];
                this.oldX = mouse.x;
                this.oldY = mouse.y;

                this.ctx.save();
                this.ctx.translate(dancer.x, dancer.y);
                this.ctx.rotate(dancer.angle);
                if (this.ctx.isPointInPath(dancer.dirArrow, this.lastX, this.lastY)) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected != dancer) this.selected = null;
                    this.rotating = dancer;
                    this.ctx.restore();
                    return;
                }
                this.ctx.restore();

                if ((dancer.x - mouse.x) ** 2 + (dancer.y - mouse.y) ** 2 < (this.dancerSize) ** 2) {
                    this.moveDancerToEnd(dancer, i);
                    if (this.selected != dancer) this.selected = null;
                    this.dragging = dancer;
                    this.dragOffsetX = dancer.x - mouse.x;
                    this.dragOffsetY = dancer.y - mouse.y;
                    this.draw();
                    return;
                }
                //No dancer was clicked on, so start box select:
                //TODO
            }
        } else {//other click, probably right or middle
            this.pageDrag = this.ctx.transformedPoint(this.lastX, this.lastY);
        }
    }
    mousemove(mouse) {
        this.lastX = mouse.x;
        this.lastY = mouse.y;
        mouse = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (this.dragging != null) {
            this.dragging.x = this.dragOffsetX + mouse.x;
            this.dragging.y = this.dragOffsetY + mouse.y;
            this.draw();
        } else if (this.rotating != null) {
            let moveX = mouse.x - this.rotating.x;
            let moveY = mouse.y - this.rotating.y;
            let dotNormal = moveY / Math.sqrt(moveX ** 2 + moveY ** 2);
            let dir = mouse.x < this.rotating.x ? 1 : -1;
            this.rotating.angle = Math.acos(dotNormal) * dir;
            this.draw();
        } else if (this.pageDrag != null) {
            let pt = this.ctx.transformedPoint(this.lastX, this.lastY);
            this.ctx.translate(pt.x - this.pageDrag.x, pt.y - this.pageDrag.y);
            this.draw();
        }
    }
    mouseup() {
        if (this.dragging == null && this.rotating == null && this.pageDrag == null) return;
        this.dragging = null;
        this.rotating = null;
        this.pageDrag = null;
        this.draw();
    }
    mouseenter(buttons) {
        if (this.dragging == null && this.rotating == null && this.pageDrag == null) return;
        if (buttons != 1) this.mouseup();
    }
    mouseclick(mouse) {
        mouse = this.ctx.transformedPoint(mouse.x, mouse.y);
        if (Math.abs(this.oldX - mouse.x) + Math.abs(this.oldY - mouse.y) > 0.001)
            return; //clicked, but then dragged too far
        this.selected = null;
        //forwards so that if overlapped, non-selected will be selected
        for (let i = 0; i < this.dancers.length; i++) {
            let dancer = this.dancers[i];
            if ((dancer.x - mouse.x) ** 2 + (dancer.y - mouse.y) ** 2 < (this.dancerSize) ** 2) {
                this.selected = dancer;
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
        if (delta) this.zoom(delta, this.ctx.transformedPoint(this.lastX, this.lastY));
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