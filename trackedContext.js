/** HTML Canvas context, but transformations are tracked so that points (e.g. click points) can be transformed as well.
 * Based on https://codepen.io/techslides/pen/zowLd */
function getTrackedContext(ctx) {
    ctx.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    ctx.xform = ctx.svg.createSVGMatrix();

    ctx.savedTransforms = [];

    /** Returns a copy of the current transformation matrix */
    ctx.getTransform = () => {
        let c = ctx.svg.createSVGMatrix();
        c.a = ctx.xform.a, c.b = ctx.xform.b, c.c = ctx.xform.c, c.d = ctx.xform.d, c.e = ctx.xform.e, c.f = ctx.xform.f;
        return c;
    }

    let save = ctx.save;
    ctx.save = () => {
        ctx.savedTransforms.push(ctx.xform.translate(0, 0));
        return save.call(ctx);
    }

    let restore = ctx.restore;
    ctx.restore = () => {
        ctx.xform = ctx.savedTransforms.pop();
        return restore.call(ctx);
    }

    let scale = ctx.scale;
    ctx.scale = (sx, sy) => {
        ctx.xform = ctx.xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    }

    let rotate = ctx.rotate;
    ctx.rotate = radians => {
        ctx.xform = ctx.xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    }

    let translate = ctx.translate;
    ctx.translate = (dx, dy) => {
        ctx.xform = ctx.xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    }

    let transform = ctx.transform;
    ctx.transform = (a, b, c, d, e, f) => {
        let m2 = ctx.svg.createSVGMatrix();
        m2.a = a, m2.b = b, m2.c = c, m2.d = d, m2.e = e, m2.f = f;
        ctx.xform = ctx.xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    }

    /** Sets the transform to the given matrix params, or resets if no params given */
    let setTransform = ctx.setTransform;
    ctx.setTransform = (a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) => {
        ctx.xform.a = a, ctx.xform.b = b, ctx.xform.c = c, ctx.xform.d = d, ctx.xform.e = e, ctx.xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    }

    /** Returns the point converted to canvas space */
    ctx.transformedPoint = (x, y) => {
        let pt = ctx.svg.createSVGPoint();
        pt.x = x, pt.y = y;
        return pt.matrixTransform(ctx.xform.inverse());
    }

    /** Returns the point converted from canvas space */
    ctx.untransformedPoint = (x, y) => {
        let pt = ctx.svg.createSVGPoint();
        pt.x = x, pt.y = y;
        return pt.matrixTransform(ctx.xform);
    }

    return ctx;
}