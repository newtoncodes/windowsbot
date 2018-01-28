'use strict';


class MathUtils {
    static easeInOutQuad(time, initial, change, duration) {
        time /= duration / 2;
        if (time < 1) return change / 2 * time*time + initial;
        time --;
        return -change / 2 * (time*(time - 2) - 1) + initial;
    }

    static easeOutQuad(time, initial, change, duration) {
        time /= duration;
        return -change * time*(time - 2) + initial;
    }

    static easeInQuad(time, initial, change, duration) {
        time /= duration;
        return change*time*time + initial;
    }

    static easeInOutCubic(time, initial, change, duration) {
        time /= duration / 2;
        if (time < 1) return change / 2 * time*time*time + initial;
        time -= 2;
        return change / 2 * (time*time*time + 2) + initial;
    }

    static easeInCubic(time, initial, change, duration) {
        time /= duration;
        return change*time*time*time + initial;
    }

    static easeOutCubic(time, initial, change, duration) {
        time /= duration;
        time--;
        return change*(time*time*time + 1) + initial;
    }

    static linearTween(time, start, end) {
        return start + (time)*(end - start);
    }

    static quadraticEaseIn(time, start, end) {
        return MathUtils.linearTween(time * time, start, end);
    }

    static quadraticEaseInOut(time, start, end) {
        var middle = (start + end) / 2;
        time *= 2;

        if (time <= 1) {
            return MathUtils.linearTween(time*time, start, middle);
        } else {
            time -= 1;
            return MathUtils.linearTween(time*time, middle, end);
        }
    }

    static quadraticEaseInOut2(time, tEdge, low, high) {
        if (time < tEdge) {
            return low + (time / tEdge)*(time / tEdge)*(high - low);
        } else if (time >= tEdge && time <= (1.0 - tEdge)) {
            return high;
        } else {
            time = time - (1.0 - tEdge);
            return low + (time / tEdge)*(time / tEdge)*(high - low);
        }
    }

    static calculateAcceleration(deltaT, Vo, Vf) {
        return (Vf - Vo) / deltaT;
    }

    static adjustAngle(angleRads) {
        if (angleRads > Math.PI) while (angleRads > Math.PI) angleRads -= 2 * Math.PI;
        else if (angleRads < -Math.PI) while (angleRads < -Math.PI) angleRads += 2 * Math.PI;
        return angleRads;
    }

    static vecToQuadrant(pt) {
        if (pt.x >= 0 && pt.y >= 0) return 0;
        if (pt.x < 0 && pt.y >= 0) return 1;
        if (pt.x < 0 && pt.y < 0) return 2;
        return 3;
    }

    static isNearZero(value) {
        if (value < 0) value = -value;
        return (value >= 0 && value <= Math.EPSILON);
    }

    static normalizedAngle(angleRads) {
        var angle = angleRads / Math.PI;
        while (angle > 2) angle -= 2;
        while (angle < -2) angle += 2;
        if (angle < -1) angle += 2;
        else if (angle > 1) angle = -2 + angle;
        return angle;
    }

    static random(m, s) {
        // mean m, standard deviation s
        let x1 = 0, x2 = 0, w = 0, y1 = 0, y2 = 0;

        do {
            x1 = 2 * Math.random() - 1;
            x2 = 2 * Math.random() - 1;
            w = x1 * x1 + x2 * x2;
        } while (w >= 1.0);

        w = Math.sqrt((-2.0 * Math.log(w)) / w);
        y1 = x1 * w;
        y2 = x2 * w;

        return m + y1 * s;
    }

    static randomScaled(scale, m, s) {
        let res = -99;
        while (res < -3.5 || res > 3.5) res = MathUtils.random(m, s);

        return (res / 3.5 * s + 1) * (scale / 2);
    }

    static randomPoint(rect) {
        var width = rect.right - rect.left - 4;
        var height = rect.bottom - rect.top - 4;

        return {
            x: rect.left + width / 2 + (MathUtils.randomScaled(2 * width / 2, 0, 1) + 0.5) - (width / 2),
            y: rect.top + height / 2 + (MathUtils.randomScaled(2 * height / 2, 0, 1) + 0.5) - (height / 2)
        };
    }

    static getVectorLength(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    static resizeVector(x, y, sz) {
        let l = MathUtils.getVectorLength(x, y);
        let r = sz / l;

        return {
            x: x * r,
            y: y * r
        };
    }
}


module.exports = MathUtils;