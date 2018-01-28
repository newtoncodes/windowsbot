'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * @augments EventEmitter
 */
class Keyboard extends EventEmitter {
    _keyboardHandler(key, down) {
        this.emit(down ? 'down' : 'up', key);
    }

    constructor() {
        super();
        this.input = require('./' + (process.arch === 'x64' ? 'x64' : 'Win32') + '/Release/input.node');
        this.setMaxListeners(1000);
    }

    on() {
        super.on(...arguments);
        this.input['subscribeKeyboard'](this._keyboardHandler.bind(this));
    }

    off() {
        super.removeListener(...arguments);
    }

    keyDown (key) {
        this.input.keyDown(key);
    }

    keyUp (key) {
        this.input.keyUp(key);
    }

    charDown (key) {
        if (typeof key === 'string') key = key.charCodeAt(0);
        this.input.charDown(key);
    }

    charUp (key) {
        if (typeof key === 'string') key = key.charCodeAt(0);
        this.input.charUp(key);
    }

    getKey(key) {
        return this.input.getKey(key);
    }

    getAllKeys() {
        return this.input.getAllKeys();
    }

    getLock(key) {
        return this.input.getLock(key);
    }

    getAllLocks() {
        return this.input.getAllLocks();
    }
}

/**
 * @augments EventEmitter
 */
class Mouse extends EventEmitter {
    _mouseHandler(type, x, y, button, delta) {
        var data = {x, y};
        if (button != -1) data.button = button;
        if (delta != -1) data.delta = delta;

        this.emit(type, data);
    }

    constructor() {
        super();
        this.input = require('./' + (process.arch === 'x64' ? 'x64' : 'Win32') + '/Release/input.node');
        this.setMaxListeners(1000);
    }

    on() {
        super.on(...arguments);
        this.input['subscribeMouse'](this._mouseHandler.bind(this));
    }

    off() {
        super.removeListener(...arguments);
    }

    getMousePosition () {
        return this.input.getMousePosition();
    }

    mouseDown (button) {
        this.input.mouseDown(button);
    }

    mouseUp (button) {
        this.input.mouseUp(button);
    }

    mouseMove (x, y) {
        this.input.mouseMove(x, y);
    }
}


module.exports = {
    Keyboard: new Keyboard(),
    Mouse: new Mouse()
};