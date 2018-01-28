'use strict';


class Screener {
    /**
     */
    constructor() {
        this.input = require('./' + (process.arch === 'x64' ? 'x64' : 'Win32') + '/Release/screener.node');
    }

    /**
     * @param {number} hwnd
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {string|null} file
     * @param {function} callback
     */
    captureWindow (hwnd, x, y, width, height, file, callback) {
        this.input.captureWindow(hwnd, x, y, width, height, file, !!file, function (width, height, pixels) {
            if (!width || !height || !pixels) return callback(new Error('Empty result.'));
            callback(null, width, height, pixels);
        });
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {string|null} file
     * @param {function} callback
     */
    captureDesktop (x, y, width, height, file, callback) {
        this.input.captureDesktop(x, y, width, height, file, !!file, function (width, height, pixels) {
            if (!width || !height || !pixels) return callback(new Error('Empty result.'));
            callback(null, width, height, pixels);
        });
    }

    /**
     * @param {number} hwnd
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {function} callback
     */
    captureWindowRegions (hwnd, x, y, width, height, callback) {
        var args = [];

        for (let i = 0, l = arguments.length - 1; i < l; i ++) {
            args.push(arguments[i])
        }

        callback = arguments[arguments.length - 1];

        args.push(function (pixels) {
            if (!pixels) return callback(new Error('Empty result.'));
            callback(null, pixels);
        });

        this.input.captureWindowRegions.apply(this.input, args);
    }

    redrawWindow (hwnd, x, y, width, height, flags, callback) {
        this.input.redrawWindow(hwnd, x, y, width, height, flags, function (result) {
            callback(null, result);
        });
    }

    redrawDesktop (x, y, width, height, flags, callback) {
        this.input.redrawDesktop(x, y, width, height, flags, function (result) {
            callback(null, result);
        });
    }
}


module.exports = new Screener();