//TODO Marqee selection. Shouldn't be too hard, but will have to make dragging and selected be arrays
//TODO add direction to dancers
/** Implements the top and front stage views, with adding and removing dancers */
class StageView extends EventTarget {
    constructor() {
        super();
        this.ctx = null; //initialized in main.js
        this.width = null; //initialized in respondCanvas()
        this.height = null; //^
        this.dancerSize = 30;
        this.zoom = 1;
        this.dragging = null; //dragged dancer
        this.selected = null; //^ but selected
        this.dancers = [] //element format: {name: "name", X: 5.6, Y: 20}
        //---TESTING---
        // this.dancers.push({ name: "name", X: 0, Y: 0 });
        // this.dancers.push({ name: "name", X: 500, Y: 0 });
        // this.dancers.push({ name: "name", X: 1000, Y: 0 });
        // this.dancers.push({ name: "name", X: 0, Y: 500 });
        // this.dancers.push({ name: "name", X: 500, Y: 500 });
        // this.dancers.push({ name: "name", X: 1000, Y: 500 });
        // this.dancers.push({ name: "name", X: 0, Y: 1000 });
        // this.dancers.push({ name: "name", X: 500, Y: 1000 });
        // this.dancers.push({ name: "name", X: 1000, Y: 1000 });
    }

    respondCanvas() {
        let old = this.width;
        this.width = parseInt(Util.getStyleValue(dom.stageView, "width"));
        this.height = parseInt(Util.getStyleValue(dom.stageView, "height"));
        dom.stageView.setAttribute("width", this.width);
        dom.stageView.setAttribute("height", this.height);
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
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
            this.ctx.fillStyle = 'rgb(0, 0, 0)';
            this.ctx.beginPath();
            this.ctx.arc(dancer.X, dancer.Y, this.dancerSize, 0, Math.PI * 2, true);
            this.ctx.fill();
        });
    }

    addDancer() {
        let x = this.width / 2;
        let y = this.height / 2;
        let safe = true;
        do { //move to non-overlapping location
            safe = true;
            this.dancers.forEach(dancer => {
                if ((dancer.X - x) ** 2 + (dancer.Y - y) ** 2 < (this.dancerSize * 2) ** 2) {
                    safe = false;
                    x += this.dancerSize * (Math.random() < 0.5 ? -1 : 1);
                    y += this.dancerSize * (Math.random() < 0.5 ? -1 : 1);
                }
            });
        } while (!safe);
        this.dancers.push({ name: "name", X: x, Y: y });
        this.draw();
    }
    removeDancer() {
        if (this.selected != null) {
            this.dancers = this.dancers.filter(dancer => dancer != this.selected);
            this.draw();
        }
    }

    mousedown(mouse) {
        for (let i = this.dancers.length - 1; i >= 0; i--) { //backwards so selected is chosen first
            let dancer = this.dancers[i];
            this.oldX = mouse.X;
            this.oldY = mouse.Y;
            if ((dancer.X - mouse.X) ** 2 + (dancer.Y - mouse.Y) ** 2 < (this.dancerSize) ** 2) {
                this.dragging = dancer;
                if (this.selected != dancer) this.selected = null;
                this.dragOffsetX = dancer.X - mouse.X;
                this.dragOffsetY = dancer.Y - mouse.Y;
                this.draw();
                break;
            }
        }
    }
    mousemove(mouse) {
        if (this.dragging == null) return;
        this.dragging.X = this.dragOffsetX + mouse.X;
        this.dragging.Y = this.dragOffsetY + mouse.Y;
        this.draw();
    }
    mouseup() {
        if (this.dragging == null) return;
        this.dragging = null;
        this.draw();
    }
    mouseenter(buttons) {
        if (this.dragging == null) return;
        if (buttons != 1) this.mouseup();
    }
    mouseclick(mouse) {
        if (Math.abs(this.oldX - mouse.X) + Math.abs(this.oldY - mouse.Y) > 0.001)
            return; //clicked, but then dragged too far
        let shouldDraw = false;
        if (this.selected != null) {
            shouldDraw = true;
            this.selected = null;
        }
        //forwards so that if overlapped, non-selected will be selected
        for (let i = 0; i < this.dancers.length; i++) {
            let dancer = this.dancers[i];
            if ((dancer.X - mouse.X) ** 2 + (dancer.Y - mouse.Y) ** 2 < (this.dancerSize) ** 2) {
                this.selected = dancer;
                this.dragging = null;
                let temp = this.dancers[this.dancers.length - 1] //swap to make selected on top
                this.dancers[this.dancers.length - 1] = dancer;
                this.dancers[i] = temp;
                this.draw();
                return;
            }
        }
        this.draw();
    }



    redraw() {
        // Clear the entire canvas
        var p1 = this.ctx.transformedPoint(0, 0);
        var p2 = this.ctx.transformedPoint(this.width, this.height);
        this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.restore();
    }

    // Adds ctx.getTransform() - returns an SVGMatrix
    // Adds ctx.transformedPoint(x,y) - returns an SVGPoint
    trackTransforms() {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var xform = svg.createSVGMatrix();
        this.ctx.getTransform = function () {
            return xform;
        };

        var savedTransforms = [];
        var save = this.ctx.save;
        this.ctx.save = function () {
            savedTransforms.push(xform.translate(0, 0));
            return save.call(this.ctx);
        };

        var restore = this.ctx.restore;
        this.ctx.restore = function () {
            xform = savedTransforms.pop();
            return restore.call(this.ctx);
        };

        var scale = this.ctx.scale;
        this.ctx.scale = function (sx, sy) {
            xform = xform.scaleNonUniform(sx, sy);
            return scale.call(this.ctx, sx, sy);
        };

        var rotate = this.ctx.rotate;
        this.ctx.rotate = function (radians) {
            xform = xform.rotate(radians * 180 / Math.PI);
            return rotate.call(this.ctx, radians);
        };

        var translate = this.ctx.translate;
        this.ctx.translate = function (dx, dy) {
            xform = xform.translate(dx, dy);
            return translate.call(this.ctx, dx, dy);
        };

        var transform = this.ctx.transform;
        this.ctx.transform = function (a, b, c, d, e, f) {
            var m2 = svg.createSVGMatrix();
            m2.a = a;
            m2.b = b;
            m2.c = c;
            m2.d = d;
            m2.e = e;
            m2.f = f;
            xform = xform.multiply(m2);
            return transform.call(this.ctx, a, b, c, d, e, f);
        };

        var setTransform = this.ctx.setTransform;
        this.ctx.setTransform = function (a, b, c, d, e, f) {
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(this.ctx, a, b, c, d, e, f);
        };

        var pt = svg.createSVGPoint();
        this.ctx.transformedPoint = function (x, y) {
            pt.x = x;
            pt.y = y;
            return pt.matrixTransform(xform.inverse());
        };
    }
}