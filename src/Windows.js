'use strict';

var EventEmitter = require('events').EventEmitter;

var Window = require('./Window');
var windows = require('../vs/windows');
var screener = require('../vs/screener');

var _windows = {};

function updateWindows() {
    var wins = windows.getAll();

    wins.forEach(function (win) {
        if (!_windows[win['hwnd']]) {
            _windows[win['hwnd']] = new Window(win['hwnd'], win['title']);
            emitter.emit('open', _windows[win['hwnd']]);
        }
    });

    Object.keys(_windows).forEach(function (hwnd) {
        hwnd = parseInt(hwnd);

        var found = false;
        for (var i = 0; i < wins.length; i ++) {
            if (wins[i]['hwnd'] == hwnd) {
                found = true;
                break;
            }
        }

        if (!found) {
            emitter.emit('close', _windows[hwnd]);
            delete _windows[hwnd];
        }
    });
}

var emitter = new EventEmitter();
var interval = 0;

class Windows {

    static subscribe(time) {
        if (interval) return;
        interval = setInterval(updateWindows, Math.max(time || 50, 50));
    }

    static unsubscribe() {
        if (interval) clearInterval(interval);
        interval = 0;
    }

    static get(hwnd) {
        if (_windows[hwnd]) return _windows[hwnd];

        if (windows.exists(hwnd)) {
            _windows[hwnd] = new Window(hwnd, windows.getText(hwnd));
        }

        return _windows[hwnd] || null;
    }

    static getAll() {
        updateWindows();

        var wins = [];

        Object.keys(_windows).forEach(function (hwnd) {
            wins.push(_windows[hwnd]);
        });

        return wins;
    }

    /**
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @param {string} [path]
     * @param {function} [callback]
     */
    static captureDesktop(x, y, width, height, path, callback) {
        callback = callback || (function () {});

        if (arguments.length === 1) {
            if (typeof arguments[0] === 'function') {
                callback = arguments[0];
                path = '';
            } else {
                path = arguments[0];
            }

            x = 0;
            y = 0;
            width = 0;
            height = 0;
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];
                path = arguments[0];
                width = 0;
                height = 0;
            } else {
                path = '';
                width = arguments[0];
                height = arguments[1];
            }

            x = 0;
            y = 0;
        } else if (arguments.length === 3) {
            throw new Error('Unexpected arguments count.');
        } else if (arguments.length === 4) {
            if (typeof arguments[3] === 'function') {
                callback = arguments[3];
                path = arguments[2];
                width = arguments[0];
                height = arguments[1];
                x = 0;
                y = 0;
            } else {
                path = '';
            }
        } else if (arguments.length === 5) {
            if (typeof arguments[4] === 'function') {
                callback = arguments[4];
                path = '';
            }
        }

        screener.captureDesktop(x || 0, y || 0, width || 0, height || 0, path || '', callback);
    }

    /**
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @param {number} [flags]
     * @param {function} [callback]
     */
    static redrawDesktop(x, y, width, height, flags, callback) {
        callback = callback || (function () {});

        if (arguments.length === 1) {
            if (typeof arguments[0] === 'function') {
                callback = arguments[0];
                flags = 0;
            } else {
                flags = arguments[0];
            }

            x = 0;
            y = 0;
            width = 0;
            height = 0;
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];
                flags = arguments[0];
                width = 0;
                height = 0;
            } else {
                flags = 0;
                width = arguments[0];
                height = arguments[1];
            }

            x = 0;
            y = 0;
        } else if (arguments.length === 3) {
            throw new Error('Unexpected arguments count.');
        } else if (arguments.length === 4) {
            if (typeof arguments[3] === 'function') {
                callback = arguments[3];
                flags = arguments[2];
                width = arguments[0];
                height = arguments[1];
                x = 0;
                y = 0;
            } else {
                flags = 0;
            }
        } else if (arguments.length === 5) {
            if (typeof arguments[4] === 'function') {
                callback = arguments[4];
                flags = 0;
            }
        }

        screener.redrawDesktop(x || 0, y || 0, width || 0, height || 0, flags || 0, callback);
    }

    static on() {
        emitter.on(...arguments);
    }

    static off() {
        emitter.removeListener(...arguments);
    }

}


module.exports = Windows;