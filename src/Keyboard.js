'use strict';

var Async = require('async');

var keyboard = require('../vs/input').Keyboard;
var Keys = require('./KeyCodes');
var Typos = require('./Typos');


class Keyboard {
    /**
     */
    static observe() {
        if (observing) return;

        observing = true;

        var locks = keyboard.getAllLocks();
        Toggled[Keys.CAPS_LOCK] = locks[0];
        Toggled[Keys.NUM_LOCK] = locks[1];
        Toggled[Keys.SCROLL_LOCK] = locks[2];

        var keys = keyboard.getAllKeys();
        keys.forEach(function (state, key) { State[key] = state; });

        Keyboard.on('down', function (key) {
            if (key === Keys.NUM_LOCK) {
                Toggled[Keys.NUM_LOCK] = !Toggled[Keys.NUM_LOCK];
            }

            if (key === Keys.CAPS_LOCK) {
                Toggled[Keys.CAPS_LOCK] = !Toggled[Keys.CAPS_LOCK];
            }

            if (key === Keys.SCROLL_LOCK) {
                Toggled[Keys.SCROLL_LOCK] = !Toggled[Keys.SCROLL_LOCK];
            }

            if (key === Keys.LEFT_SHIFT || key === Keys.RIGHT_SHIFT || key === Keys.SHIFT) {
                State[Keys.SHIFT] = true;
            }

            if (key === Keys.LEFT_ALT || key === Keys.RIGHT_ALT || key === Keys.ALT) {
                State[Keys.ALT] = true;
            }

            if (key === Keys.LEFT_CONTROL || key === Keys.RIGHT_CONTROL || key === Keys.CONTROL) {
                State[Keys.CONTROL] = true;
            }

            State[key] = true;
        });

        Keyboard.on('up', function (key) {
            if (key === Keys.LEFT_SHIFT || key === Keys.RIGHT_SHIFT || key === Keys.SHIFT) {
                State[Keys.SHIFT] = false;
            }

            if (key === Keys.LEFT_ALT || key === Keys.RIGHT_ALT || key === Keys.ALT) {
                State[Keys.ALT] = false;
            }

            if (key === Keys.LEFT_CONTROL || key === Keys.RIGHT_CONTROL || key === Keys.CONTROL) {
                State[Keys.CONTROL] = false;
            }

            State[key] = false;
        });
    }

    /**
     * @param {number|string} key
     * @param {function} callback
     */
    static down(key, callback) {
        keyDown(key, callback || (function () {}));
    }

    /**
     * @param {number|string} key
     * @param {function} callback
     */
    static up(key, callback) {
        keyUp(key, callback || (function () {}));
    }

    /**
     * @param {function} callback
     */
    static allUp(callback) {
        var fn = Object.keys(State).filter((key) => State[key]).map((key) => keyUp.bind(null, parseInt(key)));
        Async.series(fn, callback || (function () {}));
    }

    /**
     * @param {number|string|Array.<number>|Array.<string>} key
     * @param {function} callback
     */
    static press(key, callback) {
        callback = callback || (function () {});

        if (typeof key !== 'object') return keyPress(key, callback);

        var length = key.length;
        var fn = [];

        key.forEach((key) => {
            fn.push(keyDown.bind(null, key));
            fn.push((callback) => {
                setTimeout(callback, Math.round(Math.random() * 20));
            });
        });

        fn.push((callback) => {
            setTimeout(callback, Math.round(Math.random() * 40));
        });

        key.forEach((key, i) => {
            fn.push(keyUp.bind(null, key));
            if (i + 1 < length) fn.push((callback) => {
                setTimeout(callback, Math.round(Math.random() * 20));
            });
        });

        Async.series(fn);
    }

    /**
     * @param {string} text
     * @param {number} [speed] Characters per second
     * @param {number} [typos] Chance for mistakes
     * @param {function} callback
     */
    static type(text, speed, typos, callback) {
        callback = callback || (function () {});

        if (!text.length) return callback();

        if (arguments.length === 1) {
            speed = Keyboard.defaultSpeed;
            typos = Keyboard.defaultTypos;
        }
        else if (arguments.length === 2) {
            if (typeof speed === 'function') {
                callback = arguments[1];
                speed = Keyboard.defaultSpeed;
                typos = Keyboard.defaultTypos;
            } else {
                callback = new Function;
                typos = Keyboard.defaultTypos;
            }
        }
        else if (arguments.length === 3) {
            if (typeof typos === 'function') {
                callback = arguments[2];
                typos = Keyboard.defaultTypos;
            } else {
                callback = new Function;
            }
        }

        var chars = text.split('');
        var upperCases = chars.map((key) => {return isUpperCase(key);});

        var length = chars.length;
        var time = speed > 0 ? Math.round((chars.length / speed) * 1000) : 0;
        var delay = time / chars.length;

        var fn = [];

        var wasShift = Keyboard.isDown(Keys.SHIFT);

        var letter = function (key, i, callback) {
            let upperCase = upperCases[i];
            let shift = isSpecial(key) || ((upperCase && !Keyboard.capsLock) || (upperCase === false && Keyboard.capsLock));
            let isShift = Keyboard.isDown(Keys.SHIFT);

            var before = (callback) => {callback()};
            if (shift && !isShift) {
                before = (callback) => {
                    var st = Date.now();
                    keyDown(Keys.LEFT_SHIFT, () => {
                        var t = Date.now() - st;
                        setTimeout(callback, Math.max(delay * (Math.random() + 2.2) - t, 0));
                    });
                };
            } else if (!shift && isShift) {
                before = (callback) => {
                    var st = Date.now();
                    keyUp(Keys.LEFT_SHIFT, () => {
                        var t = Date.now() - st;
                        setTimeout(callback, Math.max(delay * (Math.random() + 1.2) - t, 0));
                    });
                };
            }

            before(() => {
                var st = Date.now();
                keyPress(key, () => {
                    var t = Date.now() - st;
                    if (i + 1 < length) setTimeout(callback, Math.max(delay * (Math.random() * 6 + 7) / 10 - t, 0));
                    else callback();
                });
            });
        };

        chars.forEach((key, i) => {
            if (typos && Math.random() <= typos) {
                var typoKey = getTypoKey(key);

                if (typoKey) {
                    fn.push(letter.bind(null, typoKey, i));

                    fn.push((callback) => {
                        setTimeout(() => {
                            keyPress(Keys.BACKSPACE, () => {
                                setTimeout(callback, Math.max(delay * (Math.random() * 6 + 7) / 5, 0));
                            });
                        }, Math.random() * 900 + 400);
                    });
                }
            }

            fn.push(letter.bind(null, key, i));
        });

        fn.push((callback) => {
            var isShift = Keyboard.isDown(Keys.SHIFT);

            if (!wasShift && isShift) setTimeout(keyUp.bind(null, Keys.LEFT_SHIFT, callback), Math.max(delay * (Math.random() * 6 + 7) / 10, 0));
            else if (wasShift && !isShift) setTimeout(keyDown.bind(null, Keys.LEFT_SHIFT, callback), Math.max(delay * (Math.random() * 6 + 7) / 10, 0));
            else callback();
        });

        Async.series(fn, callback);
    }

    /**
     * @param {string} type
     * @param {function} callback
     */
    static on(type, callback) {
        keyboard.on(type, callback);
    }

    /**
     * @param {string} type
     * @param {function} callback
     */
    static off(type, callback) {
        keyboard.off(type, callback);
    }

    /**
     * @returns {Object}
     */
    static get state() {
        return State;
    }

    /**
     * @returns {boolean}
     */
    static get numLock() {
        return Toggled[Keys.NUM_LOCK];
    }

    /**
     * @returns {boolean}
     */
    static get capsLock() {
        return Toggled[Keys.CAPS_LOCK];
    }

    /**
     * @returns {boolean}
     */
    static get scrollLock() {
        return Toggled[Keys.SCROLL_LOCK];
    }

    /**
     * @param {number|string} key
     * @returns {boolean}
     */
    static isDown(key) {
        key = getKeyCode(key);
        return State[key] || false;
    }
}

Keyboard.Keys = Keys;
Keyboard.defaultSpeed = 6;
Keyboard.defaultTypos = 1/10;



/**
 * @param {number|string} key
 * @param {function} callback
 */
function keyDown(key, callback) {
    var code = getKeyCode(key);
    var done = false;

    var timeout = setTimeout(() => {
        if (done) return;

        done = true;
        keyboard.off('down', listener);
        callback(true);
    }, 100);

    var listener = (k) => {
        if (k !== code || done) return;

        done = true;
        keyboard.off('down', listener);
        clearTimeout(timeout);
        callback();
    };

    if (typeof key === 'string') keyboard.charDown(key);
    else keyboard.keyDown(key);

    keyboard.on('down', listener);
}

/**
 * @param {number|string} key
 * @param {function} callback
 */
function keyUp(key, callback) {
    var code = getKeyCode(key);
    var done = false;

    var timeout = setTimeout(() => {
        if (done) return;

        done = true;
        keyboard.off('up', listener);
        callback(true);
    }, 100);

    var listener = (k) => {
        if (k !== code || done) return;

        done = true;
        keyboard.off('up', listener);
        clearTimeout(timeout);
        callback();
    };

    if (typeof key === 'string') keyboard.charUp(key);
    else keyboard.keyUp(key);

    keyboard.on('up', listener);
}

/**
 * @param {number|string} key
 * @param {function} callback
 */
function keyPress(key, callback) {
    var isShift = false;
    var needShift = false;
    var upperCase = false;
    var special = false;
    var isString = false;

    if (typeof key === 'string') {
        upperCase = isUpperCase(key);
        special = isSpecial(key);
        needShift = special || ((upperCase && !Keyboard.capsLock) || (upperCase === false && Keyboard.capsLock));
        isShift = Keyboard.isDown(Keys.SHIFT);
        isString = true;
    }

    var before = (callback) => {callback();};
    if (needShift && !isShift) before = keyDown.bind(null, Keys.LEFT_SHIFT);
    else if (!needShift && isShift) before = keyUp.bind(null, Keys.LEFT_SHIFT);

    var t = Date.now();

    before(() => {
        keyDown(key, () => {
            t = Date.now() - t;
            setTimeout(() => {
                keyUp(key, () => {
                    if (isString && needShift && !isShift) before = keyUp(Keys.LEFT_SHIFT, callback);
                    else if (isString && !needShift && isShift) before = keyDown(Keys.LEFT_SHIFT, callback);
                    else callback();
                });
            }, Math.round(Math.random() * 50 + 50) - t);
        });
    });
}

/**
 * @param {string} c
 * @returns {boolean|null}
 */
function isUpperCase(c) {
    var uc = c.toLocaleUpperCase();
    var lc = c.toLocaleLowerCase();

    if (c === lc && lc === uc) return null;
    return (c === uc);
}

/**
 * @param {string} c
 * @returns {boolean}
 */
function isSpecial(c) {
    var shifted = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '<', '>', '?', '|', ':', '"', '{', '}'];
    return (shifted.indexOf(c) !== -1);
}

/**
 * @param {string|number} key
 * @returns {Number}
 */
function getKeyCode(key) {
    if (typeof key === 'number') return key;

    if (key === '~') return '`'.charCodeAt(0);
    if (key === '!') return '1'.charCodeAt(0);
    if (key === '@') return '2'.charCodeAt(0);
    if (key === '#') return '3'.charCodeAt(0);
    if (key === '$') return '4'.charCodeAt(0);
    if (key === '%') return '5'.charCodeAt(0);
    if (key === '^') return '6'.charCodeAt(0);
    if (key === '&') return '7'.charCodeAt(0);
    if (key === '*') return '8'.charCodeAt(0);
    if (key === '(') return '9'.charCodeAt(0);
    if (key === ')') return '0'.charCodeAt(0);
    if (key === '_') return '-'.charCodeAt(0);
    if (key === '+') return '='.charCodeAt(0);
    if (key === '<') return ','.charCodeAt(0);
    if (key === '>') return '.'.charCodeAt(0);
    if (key === '?') return '/'.charCodeAt(0);
    if (key === '|') return '\\'.charCodeAt(0);
    if (key === ':') return ';'.charCodeAt(0);
    if (key === '"') return '\''.charCodeAt(0);
    if (key === '{') return '['.charCodeAt(0);
    if (key === '}') return ']'.charCodeAt(0);

    return key.toLocaleUpperCase().charCodeAt(0);
}

/**
 * @param {string} key
 * @returns {string|null}
 */
function getTypoKey(key) {
    var typos = Typos[key];
    if (!typos) return null;

    var random = Math.round(Math.random() * (typos.length - 1));
    return typos[random];
}

var State = {};
for (var i = 0; i < 256; i ++) State[i] = false;

var Toggled = {};
Toggled[Keys.NUM_LOCK] = false;
Toggled[Keys.CAPS_LOCK] = false;
Toggled[Keys.SCROLL_LOCK] = false;

var observing = false;

// TODO: should this be automatic?
Keyboard.observe();


module.exports = Keyboard;