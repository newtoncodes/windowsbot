'use strict';

var Async = require('async');
var MathUtils = require('./MathUtils');
var Bezier = require('./Spline').Bezier;
var mouse = require('../vs/input').Mouse;


class Mouse {

    /**
     * @param {number} [button]
     * @param {function} [callback]
     */
    static down (button, callback) {
        if (arguments.length === 1 && (typeof arguments[0] === 'function')) {
            callback = arguments[0];
            button = 0;
        }

        mouseDown(button || 0, callback || (function () {}));
    }

    /**
     * @param {number} [button]
     * @param {function} [callback]
     */
    static up (button, callback) {
        if (arguments.length === 1 && (typeof arguments[0] === 'function')) {
            callback = arguments[0];
            button = 0;
        }

        mouseUp(button || 0, callback || (function () {}));
    }

    /**
     * @param {number} [button]
     * @param {boolean} [recoil]
     * @param {function} [callback]
     */
    static click (button, recoil, callback) {
        callback = callback || (function () {});

        if (arguments.length === 0) {
            recoil = false;
            button = 0;
        }

        if (arguments.length === 1) {
            if (typeof arguments[0] === 'function') {
                callback = arguments[0];
                button = 0;
                recoil = false;
            } else if (typeof arguments[0] === 'boolean') {
                recoil = arguments[0];
                button = 0;
            } else {
                recoil = false;
            }
        }

        else if (arguments.length === 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];

                if (typeof arguments[0] === 'boolean') {
                    recoil = arguments[0];
                    button = 0;
                } else {
                    recoil = false;
                }
            }
        }

        mouseDown(button || 0, () => {
            setTimeout(() => {
                mouseUp(button, function () {
                    if (recoil) Mouse.recoil(callback);
                    else callback();
                }.bind(this));
            }, Math.round(Math.random() * 40 + 50));
        });
    }

    /**
     * @param {number} [button]
     * @param {boolean} [recoil]
     * @param {function} [callback]
     */
    static doubleClick (button, recoil, callback) {
        callback = callback || (function () {});

        if (arguments.length === 0) {
            recoil = false;
            button = 0;
        }

        if (arguments.length === 1) {
            if (typeof arguments[0] === 'function') {
                callback = arguments[0];
                button = 0;
                recoil = false;
            } else if (typeof arguments[0] === 'boolean') {
                recoil = arguments[0];
                button = 0;
            } else {
                recoil = false;
            }
        }

        else if (arguments.length === 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];

                if (typeof arguments[0] === 'boolean') {
                    recoil = arguments[0];
                    button = 0;
                } else {
                    recoil = false;
                }
            }
        }

        Mouse.click(button || 0, () => {
            setTimeout(() => {
                Mouse.click(button, function () {
                    if (recoil) Mouse.recoil(callback);
                    else callback();
                }.bind(this));
            }, Math.round(Math.random() * 40 + 50));
        });
    }

    /**
     * @param {number|null} [sx]
     * @param {number|null} [sy]
     * @param {number} x
     * @param {number} y
     * @param {number} [duration]
     * @param {boolean} [speed]
     * @param {function} [callback]
     */
    static drag (sx, sy, x, y, duration, speed, callback) {
        callback = callback || (function () {});

        if (arguments.length === 2) {
            x = arguments[0];
            y = arguments[1];
            sx = null;
            sy = null;
            duration = 0;
            speed = false;
        } else if (arguments.length === 3) {
            x = arguments[0];
            y = arguments[1];
            sx = null;
            sy = null;

            if (typeof arguments[2] === 'function') {
                callback = arguments[2];
                duration = 0;
                speed = false;
            } else {
                duration = arguments[2];
                speed = false;
            }
        } else if (arguments.length === 4) {
            if (typeof arguments[3] === 'function') {
                callback = arguments[3];
                duration = arguments[2];
                speed = false;

                x = arguments[0];
                y = arguments[1];
                sx = null;
                sy = null;
            } else {
                duration = 0;
                speed = false;
            }
        } else if (arguments.length === 5) {
            if (typeof arguments[4] === 'function') {
                callback = arguments[4];

                if (typeof arguments[3] === 'boolean') {
                    duration = arguments[2];
                    speed = arguments[3];
                    x = arguments[0];
                    y = arguments[1];
                    sx = null;
                    sy = null;
                } else {
                    duration = 0;
                    speed = false;
                }
            }
        } else if (arguments.length === 6) {
            if (typeof arguments[5] === 'function') {
                callback = arguments[5];
                speed = false;
            }
        }

        function doIt() {
            Mouse.down(() => {
                setTimeout(() => {
                    Mouse.move(x, y, speed ? duration : duration / 2, speed, () => {
                        setTimeout(() => {
                            Mouse.up(() => {
                                if (rnd(1, 3) == 1) Mouse.recoil(callback);
                                else callback();
                            });
                        }, rnd(2, 50));
                    });
                }, rnd(20, 100));
            });
        }

        if (sx !== null && sy !== null) {
            Mouse.move(sx, sy, speed ? duration : duration / 2, speed, function () {
                setTimeout(doIt, rnd(2, 50));
            });
        } else doIt();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {function} [callback]
     */
    static setPosition (x, y, callback) {
        mouseMove(x, y, callback || (function () {}));
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [duration]
     * @param {boolean} [speed]
     * @param {function} [callback]
     */
    static move (x, y, duration, speed, callback) {
        if (arguments.length === 3) {
            speed = false;

            if (typeof arguments[2] === 'function') {
                callback = arguments[2];
                duration = 0;
            } else {
                callback = () => {};
                duration = arguments[2];
            }
        }

        else if (arguments.length === 4) {
            if (typeof arguments[3] === 'function') {
                callback = arguments[3];
                speed = false;
            } else {
                callback = () => {};
            }
        }

        if (duration) mouseMoveSmooth(x, y, duration, speed, callback);
        else mouseMove(x, y, callback);
    }

    /**
     * @param {function} [callback]
     */
    static recoil(callback) {
        let p = Mouse.position;
        let s1 = (rnd(1, 2) == 2) ? 1 : -1;
        let s2 = (rnd(1, 2) == 2) ? 1 : -1;

        Mouse.move(p.x + s1 * rnd(5, 20), p.y + s2 * rnd(5, 20), callback || (function () {}));
    }

    /**
     * @param {string} type
     * @param {function} [callback]
     */
    static on(type, callback) {
        mouse.on(type, callback);
    }

    /**
     * @param {string} type
     * @param {function} [callback]
     */
    static off(type, callback) {
        mouse.off(type, callback);
    }

    /**
     * @returns {Object}
     */
    static get position () {
        return mouse.getMousePosition();
    }
}


/**
 * @param {number} button
 * @param {function} [callback]
 */
function mouseDown(button, callback) {
    var done = false;

    var timeout = setTimeout(() => {
        if (done) return;

        done = true;
        mouse.off('down', listener);
        callback(true);
    }, 100);

    var listener = (data) => {
        if (data.button !== button || done) return;

        done = true;
        mouse.off('down', listener);
        clearTimeout(timeout);
        callback();
    };

    mouse.mouseDown(button);
    mouse.on('down', listener);
}

/**
 * @param {number} button
 * @param {function} [callback]
 */
function mouseUp(button, callback) {
    var done = false;

    var timeout = setTimeout(() => {
        if (done) return;

        done = true;
        mouse.off('up', listener);
        callback(true);
    }, 100);

    var listener = (data) => {
        if (data.button !== button || done) return;

        done = true;
        mouse.off('up', listener);
        clearTimeout(timeout);
        callback();
    };

    mouse.mouseUp(button);
    mouse.on('up', listener);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {function} [callback]
 */
function mouseMove (x, y, callback) {
    var done = false;

    var timeout = setTimeout(() => {
        if (done) return;

        done = true;
        mouse.off('move', listener);
        callback(true);
    }, 100);

    var tt = Date.now();
    var listener = (data) => {
        if (data.x !== x || data.y !== y || done) return;

        done = true;
        mouse.off('move', listener);
        clearTimeout(timeout);
        callback();
    };

    mouse.on('move', listener);
    mouse.mouseMove(x, y);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} duration
 * @param {boolean} speed
 * @param {function} [callback]
 */
function mouseMoveSmooth(x, y, duration, speed, callback) {
    duration = duration || null;

    let p1 = mouse.getMousePosition();
    let p2 = {x: x, y: y};
    let v = {x: p2.x - p1.x, y: p2.y - p1.y};

    // Calculate the path first
    let tmp = calcStraightPath(p1, p2);
    let path = tmp.path;
    let length = tmp.length;
    let pathV = tmp.pathV;

    if (speed) duration = Math.round((MathUtils.getVectorLength(pathV.x, pathV.y) / duration) * 1000);

    // Handle instant moves
    if (duration <= 5 && duration != null) return mouseMove(x, y, callback);
    if (path.length < 4) return mouseMove(x, y, callback);

    path = randomizePath(path, pathV, length);
    Bezier.smoothPath(path, 2);

    // Find the duration if not set
    if (duration === null) duration = rnd(0.2 * length, 0.5 * length);

    let last = -1;
    let idx = -1;

    var start = Date.now();

    var finished = false;

    var timeout = setTimeout(() => {
        if (finished) return;
        finished = true;
        callback(true);
    }, duration + 1000);

    var fn = function () {
        if (finished) return;

        var time = Date.now() - start;

        if (rnd(1, 2) == 2) idx = Math.round(MathUtils.easeInOutQuad(time, 1, path.length - 1, duration));
        else idx = Math.round(MathUtils.easeInOutCubic(time, 1, path.length - 1, duration));

        if (idx < 0) idx = 0;
        else if (idx > path.length - 1) idx = path.length - 1;
        if (idx <= last) return setTimeout(fn, 2);

        last = idx;

        mouse.mouseMove(path[idx].x, path[idx].y);

        if (idx == path.length - 1) return setTimeout(() => {
            finished = true;
            clearTimeout(timeout);
            mouseMove(p2.x, p2.y, callback);
        }, 0);

        setTimeout(fn, 2);
    };

    fn();
}

/**
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function rnd (min, max) {
    var randVal = min + (Math.random() * (max - min));
    return Math.round(randVal);
}

/**
 * @param {Object} p1
 * @param {Object} p2
 * @returns {Object}
 */
function calcStraightPath(p1, p2) {
    // Generate n = length / 10 points of the vector between these two points
    var path = [];

    var pathV = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
    };

    var length = Math.sqrt(pathV.x * pathV.x + pathV.y * pathV.y);

    var STEP_ = STEP;
    if (length < 300) STEP_ = 5;
    if (length < 200) STEP_ = 2;
    if (length < 80) STEP_ = 1;

    var n = Math.floor(length / STEP_);
    var step = {
        x: pathV.x / n,
        y: pathV.y / n
    };

    for (let i = 0; i < n; i++) {
        path.push({
            x: p1.x + step.x * (i + 1),
            y: p1.y + step.y * (i + 1)
        });
    }

    return {
        path: path,
        pathV: pathV,
        length: length
    };
}

/**
 * @param {Array} path
 * @param {Object} pathV
 * @param {number} height
 * @param {boolean} direction
 */
function curvePath(path, pathV, height, direction) {
    let theta = direction ? 90 : -90;
    let cs = Math.cos(theta * Math.PI / 180);
    let sn = Math.sin(theta * Math.PI / 180);

    let dx = pathV.x * cs - pathV.y * sn;
    let dy = pathV.x * sn + pathV.y * cs;
    let div = {x: dx, y: dy};
    let dir = {x: pathV.x, y: pathV.y};

    let size = path.length;

    let end = size - 1;
    let mid = Math.floor(size / 2);

    var length = MathUtils.getVectorLength(pathV.x, pathV.y);
    var STEP_ = STEP;
    if (length < 300) STEP_ = 5;
    if (length < 200) STEP_ = 2;
    if (length < 80) STEP_ = 1;

    path.forEach((point, i) => {
        let diff = mid - i;
        let sz = height;

        if (diff < 0) sz = MathUtils.easeInOutQuad(-diff, height, 1 - height, Math.floor(size / 2));
        else sz = MathUtils.easeInOutQuad(Math.floor(size / 2) - diff, 1, height, Math.floor(size / 2));

        div = MathUtils.resizeVector(dx, dy, sz);
        dir = MathUtils.resizeVector(pathV.x, pathV.y, i * STEP_);

        point.x = Math.round(dir.x + div.x + path[0].x);
        point.y = Math.round(dir.y + div.y + path[0].y);
    });
}

/**
 * @param {Array} path
 * @param {Object} pathV
 * @param {number} length
 */
function randomizePath(path, pathV, length) {
    // Curve the path a little
    curvePath(path, pathV, rnd((length / 1000) * 4, (length / 1000) * 16), (rnd(1, 2) == 2));

    // Sometimes on long path curve a little more somewhere (a bubble)
    // int r = rnd((_length / 1000) * 4, (_length / 1000) * 16);
    // int sz = _path.length;
    // sz = rnd(sz * 0.1, sz * 0.4);
    // if (sz < 3) sz = 3;
    // if (sz > _path.length) sz = _path.length;
    // curvePath(rnd(0, _path.length - sz), sz, r, (rnd(1, 2) == 2));

    // Randomize every point a very little (0-2px)
    path.forEach((point) => {
        if (rnd(1, length > 150 ? 10 : 5) == 5) {
            point.x += (1 - rnd(1, 3));
            point.y += (1 - rnd(1, 3));
        }
    });

    return path;
}


const STEP = 10;

module.exports = Mouse;