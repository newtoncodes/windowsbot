'use strict';


class Windows {
    /**
     */
    constructor() {
        this.input = require('./' + (process.arch === 'x64' ? 'x64' : 'Win32') + '/Release/windows.node');
    }

    /**
     * @param {number} hwnd
     * @returns {number}
     */
    getTop(hwnd) {
        return this.input.getTopWindow(hwnd);
    }

    /**
     * @returns {number}
     */
    getActive() {
        return this.input.getActiveWindow();
    }

    /**
     * @returns {number}
     */
    getForeground() {
        return this.input.getForegroundWindow();
    }

    /**
     * @returns {number}
     */
    getFocus() {
        return this.input.getFocus();
    }

    /**
     * @param {number} hwnd
     * @returns {Object}
     */
    getRect(hwnd) {
        return this.input.getWindowRect(hwnd);
    }

    /**
     * @param {number} hwnd
     * @returns {boolean}
     */
    isVisible(hwnd) {
        return this.input.isWindowVisible(hwnd);
    }

    /**
     * @param {number} hwnd
     * @returns {boolean}
     */
    exists(hwnd) {
        return this.input.isWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     * @returns {string}
     */
    getText(hwnd) {
        return this.input.getWindowText(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    setActive(hwnd) {
        return this.input.setActiveWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    setForeground(hwnd) {
        return this.input.setForegroundWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    setFocus(hwnd) {
        this.input.setFocus(hwnd);
    }

    /**
     * @param {number} hwnd
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    setRect(hwnd, x, y, width, height) {
        this.input.setWindowRect(hwnd, x, y, width, height);
    }

    /**
     * @param {number} hwnd
     */
    show(hwnd) {
        this.input.showWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    hide(hwnd) {
        this.input.hideWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    minimize(hwnd) {
        this.input.minimizeWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    unminimize(hwnd) {
        this.input.showWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    maximize(hwnd) {
        this.input.maximizeWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     */
    unmaximize(hwnd) {
        this.input.unmaximizeWindow(hwnd);
    }

    /**
     * @param {number} hwnd
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {boolean} repaint
     */
    move(hwnd, x, y, width, height, repaint) {
        this.input.moveWindow(hwnd, x, y, width, height, repaint);
    }

    /**
     * @param {number} hwnd
     * @param {boolean} altTab
     */
    switchTo(hwnd, altTab) {
        this.input.switchToThisWindow(hwnd, altTab);
    }

    /**
     * @param {number} hwnd
     * @param {boolean} invert
     */
    flash(hwnd, invert) {
        this.input.flashWindow(hwnd, invert);
    }

    /**
     * @param {number} hwnd
     */
    close(hwnd) {
        this.input.closeWindow(hwnd);
    }

    /**
     * @returns {Array}
     */
    getAll() {
        return this.input.getWindows();
    }
}


module.exports = new Windows();