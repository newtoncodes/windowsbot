'use strict';

var EventEmitter = require('events').EventEmitter;
var windows = require('../vs/windows');
var screener = require('../vs/screener');


/**
 * @augments EventEmitter
 */
class Window extends EventEmitter {

    /**
     * @param {string} type
     * @param {number} time
     * @private
     */
    _subscribe(type, time) {
        if (this._intervals[type]) return;

        this._cache[type] = this[type];

        this._intervals[type] = setInterval(function () {
            if (this._cache[type] === this[type]) return;

            this._cache[type] = this[type];
            var value = this._cache[type];

            if (type === 'exists') {
                if (value) this.emit('open');
                else this.emit('close');
            }

            if (type === 'active') {
                if (value) this.emit('activate');
                else this.emit('deactivate');
            }

            if (type === 'visible') {
                if (value) this.emit('show');
                else this.emit('hide');
            }

            if (type === 'foreground') {
                if (value) this.emit('foreground');
                else this.emit('background');
            }

            if (type === 'title') this.emit('title', value);
            if (type === 'text') this.emit('text', value);
        }.bind(this), Math.max(time || 50, 50));
    }

    /**
     * @param {string} [type]
     * @private
     */
    _unsubscribe(type) {
        if (!type) {
            Object.keys(this._intervals).forEach(function () {
                if (this._intervals[type]) clearInterval(this._intervals[type]);
                this._intervals[type] = 0;
            }.bind(this));
        } else {
            if (this._intervals[type]) clearInterval(this._intervals[type]);
            this._intervals[type] = 0;
        }
    }

    /**
     * @param {number} hwnd
     * @param {string} title
     */
    constructor(hwnd, title) {
        super();

        this._hwnd = hwnd || 0;
        this._title = title || '';

        this._intervals = {};
        this._cache = {};
    }

    /**
     * @param {string} type
     * @param {function} callback
     */
    on(type, callback) {
        if (type === 'close') this._subscribe('exists', Window.refreshInterval);
        if (type === 'title') this._subscribe('title', Window.refreshInterval);
        if (type === 'text') this._subscribe('text', Window.refreshInterval);
        if (type === 'activate') this._subscribe('active', Window.refreshInterval);
        if (type === 'deactivate') this._subscribe('active', Window.refreshInterval);
        if (type === 'show') this._subscribe('visible', Window.refreshInterval);
        if (type === 'hide') this._subscribe('visible', Window.refreshInterval);
        if (type === 'foreground') this._subscribe('foreground', Window.refreshInterval);
        if (type === 'background') this._subscribe('foreground', Window.refreshInterval);

        super.on(...arguments);
    }

    /**
     * @param {string} type
     * @param {function} callback
     */
    off(type, callback) {
        super.removeListener(...arguments);

        if (!this['_events']['close']) this._unsubscribe('exists');
        if (!this['_events']['title']) this._unsubscribe('title');
        if (!this['_events']['text']) this._unsubscribe('text');
        if (!this['_events']['activate']) this._unsubscribe('active');
        if (!this['_events']['deactivate']) this._unsubscribe('active');
        if (!this['_events']['show']) this._unsubscribe('visible');
        if (!this['_events']['hide']) this._unsubscribe('visible');
        if (!this['_events']['foreground']) this._unsubscribe('foreground');
        if (!this['_events']['background']) this._unsubscribe('foreground');
    }

    /**
     *
     */
    activate() {
        if (this._closed) throw new Error('Window is closed.');
        windows.setActive(this._hwnd);
    }

    /**
     *
     */
    focus() {
        if (this._closed) throw new Error('Window is closed.');
        windows.setFocus(this._hwnd);
    }

    /**
     *
     */
    show() {
        if (this._closed) throw new Error('Window is closed.');
        windows.show(this._hwnd);
    }

    /**
     *
     */
    hide() {
        if (this._closed) throw new Error('Window is closed.');
        windows.hide(this._hwnd);
    }

    /**
     *
     */
    minimize() {
        if (this._closed) throw new Error('Window is closed.');
        windows.minimize(this._hwnd);
    }

    /**
     *
     */
    unminimize() {
        if (this._closed) throw new Error('Window is closed.');
        windows.unminimize(this._hwnd);
    }

    /**
     *
     */
    maximize() {
        if (this._closed) throw new Error('Window is closed.');
        windows.maximize(this._hwnd);
    }

    /**
     *
     */
    unmaximize() {
        if (this._closed) throw new Error('Window is closed.');
        windows.unmaximize(this._hwnd);
    }

    /**
     *
     */
    switchTo(altTab) {
        if (this._closed) throw new Error('Window is closed.');
        windows.switchTo(this._hwnd, altTab === undefined ? true : (altTab || false));
    }

    /**
     * @param {boolean} [invert]
     */
    flash(invert) {
        if (this._closed) throw new Error('Window is closed.');
        windows.flash(this._hwnd, invert || false);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [width]
     * @param {number} [height]
     * @param {boolean} [repaint]
     */
    move(x, y, width, height, repaint) {
        if (this._closed) throw new Error('Window is closed.');

        if (width === undefined || height === undefined || width === null || height === null) {
            var rect = windows.getRect(this._hwnd);
            if (width === undefined || width === null) width = rect.right - rect.left;
            if (height === undefined || height === null) height = rect.bottom - rect.top;
        }

        windows.move(this._hwnd, x, y, width, height, repaint || false);
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {boolean} [repaint]
     */
    resize(width, height, repaint) {
        if (this._closed) throw new Error('Window is closed.');

        var rect = windows.getRect(this._hwnd);

        windows.move(this._hwnd, rect.left, rect.top, width, height, repaint || false);
    }

    /**
     *
     */
    close() {
        if (this._closed) throw new Error('Window is closed.');

        windows.close(this._hwnd);
    }

    /**
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @param {string} [path]
     * @param {function} [callback]
     */
    capture(x, y, width, height, path, callback) {
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

        screener.captureWindow(this._hwnd, x || 0, y || 0, width || 0, height || 0, path || '', callback);
    }

    /**
     * @param {Object} regions
     * @param {function} callback
     */
    captureRegions(regions, callback) {
        var regionMap = {};
        var args = [];

        args.push(this._hwnd);

        Object.keys(regions).forEach((key, i) => {
            let region = regions[key];

            args.push(region.x);
            args.push(region.y);
            args.push(region.width);
            args.push(region.height);

            regionMap[i] = key;
        });

        args.push(function (error, result) {
            if (error) return callback(error);

            var regions = {};
            result.forEach((obj, i) => {
                regions[regionMap[i]] = obj;
            });

            callback(null, regions);
        });

        screener.captureWindowRegions.apply(screener, args);
    }

    /**
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @param {number} [flags]
     * @param {function} [callback]
     */
    redraw(x, y, width, height, flags, callback) {
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

        screener.redrawWindow(this._hwnd, x || 0, y || 0, width || 0, height || 0, flags || 0, callback);
    }

    /**
     * @returns {number}
     */
    get hwnd() {
        return this._hwnd;
    }

    /**
     * @returns {string}
     */
    get title() {
        return this._title;
    }

    /**
     * @returns {boolean}
     */
    get active() {
        if (this._closed) return false;
        return windows.getActive() == this._hwnd;
    }

    /**
     * @returns {boolean}
     */
    get visible() {
        if (this._closed) return false;
        return windows.isVisible(this._hwnd);
    }

    /**
     * @returns {boolean}
     */
    get foreground() {
        if (this._closed) return false;
        return windows.getForeground() == this._hwnd;
    }

    /**
     * @returns {boolean}
     */
    get exists() {
        if (this._closed) return false;
        var value = windows.exists(this._hwnd);

        if (!value) {
            this._unsubscribe();
            this._closed = true;
        }

        return value;
    }

    /**
     * @returns {string}
     */
    get text() {
        if (this._closed) return '';
        return windows.getText(this._hwnd);
    }

    /**
     * @returns {Object}
     */
    get rect() {
        if (this._closed) return {left: 0, top: 0, right: 0, bottom: 0};
        return windows.getRect(this._hwnd);
    }

}


Window.refreshInterval = 20;


module.exports = Window;