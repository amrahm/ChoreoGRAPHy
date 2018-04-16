/** HTML Canvas context, but transformations are tracked so that points (e.g. click points) can be transformed as well.
 * Based on https://codepen.io/techslides/pen/zowLd */
let TrackedContext = {
    /** constructor */
    ctor(context) {
        this.ctx = context; //initialized in main.js
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.xform = this.svg.createSVGMatrix();

        this.savedTransforms = [];
    },

    /** Returns a copy of the current transformation matrix */
    getTransform() {
        let c = this.svg.createSVGMatrix();
        c.a = this.xform.a, c.b = this.xform.b, c.c = this.xform.c, c.d = this.xform.d, c.e = this.xform.e, c.f = this.xform.f;
        return c;
    },

    getCtx() {
        return this.ctx;
    },

    save() {
        this.savedTransforms.push(this.xform.translate(0, 0));
        this.ctx.save();
    },

    restore() {
        this.xform = this.savedTransforms.pop();
        this.ctx.restore();
    },

    scale(sx, sy) {
        this.xform = this.xform.scaleNonUniform(sx, sy);
        this.ctx.scale(sx, sy);
    },

    rotate(radians) {
        this.xform = this.xform.rotate(radians * 180 / Math.PI);
        this.ctx.rotate(radians);
    },

    translate(dx, dy) {
        this.xform = this.xform.translate(dx, dy);
        this.ctx.translate(dx, dy);
    },

    transform(a, b, c, d, e, f) {
        let m2 = this.svg.createSVGMatrix();
        m2.a = a, m2.b = b, m2.c = c, m2.d = d, m2.e = e, m2.f = f;
        this.xform = this.xform.multiply(m2);
        this.ctx.transform(a, b, c, d, e, f);
    },

    /** Sets the transform to the given matrix params, or resets if no params given */
    setTransform(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        this.xform.a = a, this.xform.b = b, this.xform.c = c, this.xform.d = d, this.xform.e = e, this.xform.f = f;
        this.ctx.setTransform(a, b, c, d, e, f);
    },

    /** Returns the point converted to canvas space */
    transformedPoint(x, y) {
        let pt = this.svg.createSVGPoint();
        pt.x = x, pt.y = y;
        return pt.matrixTransform(this.xform.inverse());
    },

    /** Returns the point converted from canvas space */
    untransformedPoint(x, y) {
        let pt = this.svg.createSVGPoint();
        pt.x = x, pt.y = y;
        return pt.matrixTransform(this.xform);
    }
}

/** This crazy shit lets us extend the canvas to include the above operations.
 * It catches any unkown function calls or property gets and passes them to the real context. */
let getTrackedContext = (ctx) => {
    let copy = Object.create(TrackedContext);
    copy.canvas = ctx.canvas;
    let trackedContext = new Proxy(copy, {
        get(target, prop, receiver) {
            if (target[prop] === undefined) {
                return (...args) => target.ctx[prop].apply(target.ctx, args);
            } else {
                return target[prop];
            }
        },
        set(target, prop, value) {
            if (prop == "ctx" || prop == "svg" || prop == "xform" || prop == "savedTransforms") {
                return Reflect.set(...arguments);
            } else {
                var args = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
                target.ctx[prop] = args;
                return true;
            }
        }
    });
    trackedContext.ctor(ctx);
    return trackedContext;
}