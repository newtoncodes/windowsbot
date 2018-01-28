'use strict';

var MathUtils = require('./MathUtils');


class SplineBase {
    constructor() {
        this._points = [];
        this._elimColinearPoints = true;
    }

    resetDerived() {
        this._diagElems.clear();
        this._bCol.clear();
        this._xCol.clear();
        this._offDiagElems.clear();
    }

    get points () {
        return this._points;
    }

    reset() {
        this._points = [];
        this.resetDerived();
    }

    addPoint(pt) {
        // If this new point is colinear with the two previous points,
        // pop off the last point and add this one instead.

        if (this._elimColinearPoints && this._points.length > 2) {
            let N = this._points.length - 1;
            let p0 = this._points[N - 1] - this._points[N - 2];
            let p1 = this._points[N] - this._points[N - 1];
            let p2 = pt - this._points[N];

            // We test for colinearity by comparing the slopes
            // of the two lines.  If the slopes are the same, we assume colinearity.
            let delta = (p2.y - p1.y) * (p1.x - p0.x) - (p1.y - p0.y) * (p2.x - p1.x);
            if (MathUtils.isNearZero(delta)) this._points.pop();
        }

        this._points.push(pt);
    }

    evaluate() {
        //
    }

    compute() {
        //
    }
}


/**
 * @augments SplineBase
 */
class ClassicSpline extends SplineBase {
    /**
     *
     */
    constructor() {
        super();

        this._xCol = [];
        this._bCol = [];
        this._diagElems = [];
        this._offDiagElems = [];
    }

    /**
     * Evaluate the spline for the ith segment
     * for parameter.  The value of parameter t must be between 0 and 1.
     *
     * @param {number} seg
     * @param {number} t
     * @returns {*}
     */
    evaluate(seg, t) {
        var points = this._points;

        const ONE_OVER_SIX = 1.0 / 6.0;

        let oneMinust = 1.0 - t;
        let t3Minust = t*t*t - t;
        let oneMinust3minust = oneMinust * oneMinust * oneMinust - oneMinust;
        let deltaX = points[seg + 1].x - points[seg].x;
        let yValue = t * points[seg + 1].y +
            oneMinust*points[seg].y +
            ONE_OVER_SIX*deltaX*deltaX*(t3Minust * this._xCol[seg + 1] - oneMinust3minust * this._xCol[seg]);
        let xValue = t*(points[seg + 1].x - points[seg].x) + points[seg].x;

        return {
            x: xValue,
            y: yValue
        };
    }

    /**
     * @returns {boolean}
     */
    compute() {
        let p = this._points;

        for (let idx = 1; idx < p.length; ++idx) {
            this._diagElems[idx] = 2 * (p[idx + 1].x - p[idx - 1].x);
        }

        for (let idx = 0; idx < p.length; ++idx) {
            this._offDiagElems[idx] = p[idx + 1].x - p[idx].x;
        }

        for (let idx = 1; idx < p.length; ++idx) {
            this._bCol[idx] = 6.0*((p[idx + 1].y - p[idx].y) / this._offDiagElems[idx] - (p[idx].y - p[idx - 1].y) / this._offDiagElems[idx - 1]);
        }

        this._xCol[0] = 0.0;
        this._xCol[p.length - 1] = 0.0;

        for (let idx = 1; idx < p.length - 1; ++idx) {
            this._bCol[idx + 1] = this._bCol[idx + 1] - this._bCol[idx] * this._offDiagElems[idx] / this._diagElems[idx];
            this._diagElems[idx + 1] = this._diagElems[idx + 1] - this._offDiagElems[idx] * this._offDiagElems[idx] / this._diagElems[idx];
        }

        for (let idx = p.length - 2; idx > 0; --idx) {
            this._xCol[idx] = (this._bCol[idx] - this._offDiagElems[idx] * this._xCol[idx + 1]) / this._diagElems[idx];
        }

        return true;
    }
}



/**
 * @augments SplineBase
 */
class BezierSpine extends SplineBase {
    /**
     *
     */
    constructor() {
        super();

        this._p1Points = [];
        this._p2Points = [];
    }

    /**
     * Evaluate the spline for the ith segment
     * for parameter.  The value of parameter t must be between 0 and 1.
     *
     * @param {number} seg
     * @param {number} t
     * @returns {*}
     */
    evaluate(seg, t) {
        let omt = 1.0 - t;

        let p0 = this._points[seg];
        let p1 = this._p1Points[seg];
        let p2 = this._p2Points[seg];
        let p3 = this._points[seg + 1];

        let xVal = omt*omt*omt*p0.x + 3 * omt*omt*t*p1.x + 3 * omt*t*t*p2.x + t*t*t*p3.x;
        let yVal = omt*omt*omt*p0.y + 3 * omt*omt*t*p1.y + 3 * omt*t*t*p2.y + t*t*t*p3.y;

        return {
            x: xVal,
            y: yVal
        };
    }

    /**
     * Clear out all the data.
     */
    resetDerived() {
        this._p1Points = [];
        this._p2Points = [];
    }

    /**
     * @returns {boolean}
     */
    compute() {
        let p = this._points;

        let N = p.length - 1;
        resizePoints(this._p1Points, N);
        resizePoints(this._p2Points, N);

        if (N == 0) return false;

        if (N == 1) {
            // Only 2 points...just create a straight line.

            // Constraint: 3*P1 = 2*P0 + P3
            //_p1Points[0] = (2.0/3.0 * p[0] + 1.0/3.0*p[1]);
            // Constraint: P2 = 2*P1 - P0
            //_p2Points[0] = 2.0 * _p1Points[0] - p[0];

            return true;
        }

        // rhs vector
        var a = resizePoints([], N);
        var b = resizePoints([], N);
        var c = resizePoints([], N);
        var r = resizePoints([], N);

        // left most segment
        a[0].x = 0;
        b[0].x = 2;
        c[0].x = 1;
        r[0].x = p[0].x + 2 * p[1].x;

        a[0].y = 0;
        b[0].y = 2;
        c[0].y = 1;
        r[0].y = p[0].y + 2 * p[1].y;

        // internal segments
        for (let i = 1; i < N - 1; i++) {
            a[i].x = 1;
            b[i].x = 4;
            c[i].x = 1;
            r[i].x = 4 * p[i].x + 2 * p[i + 1].x;

            a[i].y = 1;
            b[i].y = 4;
            c[i].y = 1;
            r[i].y = 4 * p[i].y + 2 * p[i + 1].y;
        }

        // right segment
        a[N - 1].x = 2;
        b[N - 1].x = 7;
        c[N - 1].x = 0;
        r[N - 1].x = 8 * p[N - 1].x + p[N].x;

        a[N - 1].y = 2;
        b[N - 1].y = 7;
        c[N - 1].y = 0;
        r[N - 1].y = 8 * p[N - 1].y + p[N].y;


        // solves Ax=b with the Thomas algorithm (from Wikipedia)
        for (let i = 1; i < N; i++) {
            let m;

            m = a[i].x / b[i - 1].x;
            b[i].x = b[i].x - m * c[i - 1].x;
            r[i].x = r[i].x - m * r[i - 1].x;

            m = a[i].y / b[i - 1].y;
            b[i].y = b[i].y - m * c[i - 1].y;
            r[i].y = r[i].y - m * r[i - 1].y;
        }

        this._p1Points[N - 1].x = r[N - 1].x / b[N - 1].x;
        this._p1Points[N - 1].y = r[N - 1].y / b[N - 1].y;
        for (let i = N - 2; i >= 0; --i) {
            this._p1Points[i].x = (r[i].x - c[i].x * this._p1Points[i + 1].x) / b[i].x;
            this._p1Points[i].y = (r[i].y - c[i].y * this._p1Points[i + 1].y) / b[i].y;
        }

        // we have p1, now compute p2
        for (let i = 0; i < N - 1; i++) {
            this._p2Points[i].x = 2 * p[i + 1].x - this._p1Points[i + 1].x;
            this._p2Points[i].y = 2 * p[i + 1].y - this._p1Points[i + 1].y;
        }

        this._p2Points[N - 1].x = 0.5 * (p[N].x + this._p1Points[N - 1].x);
        this._p2Points[N - 1].y = 0.5 * (p[N].y + this._p1Points[N - 1].y);

        return true;
    }

    /**
     * @param {Array} path
     * @param {number} divisions
     */
    static smoothPath(path, divisions) {
        if (path.length < 2) return;

        const MAX_POINTS = 10000;
        let spline = new BezierSpine();

        // Grab the points.
        for (let idx = 0; idx < MAX_POINTS && path.length > 0; idx++) {
            spline.addPoint(path.pop());
        }

        // Smooth them.
        spline.compute();

        // Push them back in.
        for (let idx = spline.points.length - 2; idx >= 0; --idx) {
            for (let division = divisions - 1; division >= 0; --division) {
                let t = division / divisions;
                path.push(spline.evaluate(idx, t));
            }
        }
    }
}

function resizePoints(points, size) {
    points.length = size;
    for (var i = 0; i < size; i ++) {
        points[i] = points[i] || {x: 0, y: 0};
    }

    return points;
}


module.exports = {
    Bezier: BezierSpine,
    Classic: ClassicSpline
};