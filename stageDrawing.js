//TODO: We need a way to get back to this state
/** Implements drawing a custom stage */
const boxSize = 10;
const distThreshold = 30; //num pixels close that are considered close enough to close
class StageDrawing extends EventTarget {
    constructor() {
        super();
        this.ctx = null; //initialized in main.js
        this.width = null; //initialized in respondCanvas()
        this.height = null; //^
        this.stage = new Path2D();
        this.lastPoint = null;
        this.numPoints = 0;
        this.md = false;
        this.firstPoint = null;
        this.closed = false;
        this.bounds = { minX: 100000000, maxX: 0, minY: 1000000000000, maxY: 0 };
        this.points = [];
    }

    /** Respond to window resize so that drawings don't get distorted. */
    respondCanvas() {
        this.width = parseInt(Util.getStyleValue(dom.drawingCanvas, "width"));
        this.height = parseInt(Util.getStyleValue(dom.drawingCanvas, "height"));
        dom.drawingCanvas.setAttribute("width", this.width);
        dom.drawingCanvas.setAttribute("height", this.height);
        this.draw();
    }

    draw(ctx = this.ctx) {
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.closed) {
            ctx.fillStyle = 'rgb(255, 250, 245)';
            ctx.fill(this.stage);
        } else if (this.numPoints > 0) {
            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.strokeRect(this.lastPoint.x - boxSize / 2, this.lastPoint.y - boxSize / 2, boxSize, boxSize);
        }
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.stroke(this.stage);
    }

    mousedown(mouse) {
        if (this.closed) return;
        this.md = true;
        this.numPoints++;
        this.lastPoint = mouse;
        this.draw();
    }
    mousemove(mouse) {
        if (!this.md) return;
        this.lastPoint = mouse;
        this.draw();
    }
    mouseup() {
        if (!this.md) return;
        this.md = false;
        if (this.numPoints === 1) {
            this.stage.moveTo(this.lastPoint.x, this.lastPoint.y);
            this.firstPoint = this.lastPoint;
            this.checkBounds(this.lastPoint);
            this.points.push(this.lastPoint);
        } else if (this.numPoints > 3 && Math.abs(this.lastPoint.x - this.firstPoint.x) ** 2 +
            Math.abs(this.lastPoint.y - this.firstPoint.y) ** 2 < distThreshold ** 2) {
            this.closed = true;
            this.stage.closePath();
        } else {
            this.stage.lineTo(this.lastPoint.x, this.lastPoint.y);
            this.checkBounds(this.lastPoint);
            this.points.push(this.lastPoint);
        }
        this.draw();
    }
    dblclick() {
        if (this.closed || this.numPoints <= 3) return;
        this.closed = true;
        this.stage.closePath();
        this.draw();
    }

    doneDrawing() {
        dom.stageDrawing.style.display = "none";
        let bounds = { maxX: this.bounds.maxX - this.bounds.minX, maxY: this.bounds.maxY - this.bounds.minY }
        let shiftX = -this.bounds.minX;
        let shiftY = -this.bounds.minY;
        let stage = new Path2D();
        this.points.forEach(point => {
            stage.lineTo(point.x + shiftX, point.y + shiftY);
        });
        stage.closePath();
        stageView.setStage(stage, bounds, 500);
        timeline.insertFormation();
    }



    checkBounds(point) {
        if (point.x < this.bounds.minX)
            this.bounds.minX = point.x;
        else if (point.x > this.bounds.maxX)
            this.bounds.maxX = point.x;

        if (point.y < this.bounds.minY)
            this.bounds.minY = point.y;
        else if (point.y > this.bounds.maxY)
            this.bounds.maxY = point.y;
    }
}