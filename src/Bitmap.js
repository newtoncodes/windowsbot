'use strict';

var Fs = require('fs');


class BmpEncoder {
    constructor (imgData) {
        this.buffer = imgData.data;
        this.width = imgData.width;
        this.height = imgData.height;
        this.extraBytes = this.width%4;
        this.rgbSize = this.height*(3*this.width+this.extraBytes);
        this.headerInfoSize = 40;

        this.data = [];

        this.flag = "BM";
        this.reserved = 0;
        this.offset = 54;
        this.fileSize = this.rgbSize+this.offset;
        this.planes = 1;
        this.bitPP = 24;
        this.compress = 0;
        this.hr = 0;
        this.vr = 0;
        this.colors = 0;
        this.importantColors = 0;
    }

    encode () {
        var tempBuffer = new Buffer(this.offset+this.rgbSize);
        this.pos = 0;
        tempBuffer.write(this.flag,this.pos,2);this.pos+=2;
        tempBuffer.writeUInt32LE(this.fileSize,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.reserved,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.offset,this.pos);this.pos+=4;

        tempBuffer.writeUInt32LE(this.headerInfoSize,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.width,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.height,this.pos);this.pos+=4;
        tempBuffer.writeUInt16LE(this.planes,this.pos);this.pos+=2;
        tempBuffer.writeUInt16LE(this.bitPP,this.pos);this.pos+=2;
        tempBuffer.writeUInt32LE(this.compress,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.rgbSize,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.hr,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.vr,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.colors,this.pos);this.pos+=4;
        tempBuffer.writeUInt32LE(this.importantColors,this.pos);this.pos+=4;

        var i=0;
        var rowBytes = 3*this.width+this.extraBytes;

        for (var y = this.height - 1; y >= 0; y--){
            for (var x = 0; x < this.width; x++){
                var p = this.pos+y*rowBytes+x*3;
                tempBuffer[p+2]= this.buffer[i++];//r
                tempBuffer[p+1] = this.buffer[i++];//g
                tempBuffer[p]  = this.buffer[i++];//b
                i++;
            }
            if(this.extraBytes>0){
                var fillOffset = this.pos+y*rowBytes+this.width*3;
                tempBuffer.fill(0,fillOffset,fillOffset+this.extraBytes);
            }
        }

        return tempBuffer;
    }
}


class BmpDecoder {
    constructor (buffer, isArray, width, height, bitPP) {
        this.pos = 0;
        this.buffer = isArray ? null : buffer;
        this.array = isArray ? buffer : null;
        this.flag = isArray ? 'BM' : this.buffer.toString("utf-8", 0, this.pos += 2);
        if (this.flag != 'BM') throw new Error("Invalid BMP File");
        if (!isArray) this.parseHeader();
        else {
            this.bitPP = bitPP || 24;
            this.width = width;
            this.height = height;
            this.negative = true;
        }

        this.parseBGR();
    }

    parseHeader () {
        this.fileSize = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.reserved = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.offset = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.headerSize = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.width = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;

        this.height = this.buffer.readInt32LE(this.pos);
        if (this.height < 0) {
            this.negative = true;
            this.height = Math.abs(this.height);
        }

        this.pos += 4;
        this.planes = this.buffer.readUInt16LE(this.pos);
        this.pos += 2;
        this.bitPP = this.buffer.readUInt16LE(this.pos);
        this.pos += 2;
        this.compress = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.rawSize = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.hr = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.vr = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.colors = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        this.importantColors = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;

        if (this.bitPP < 24) {
            var len = this.colors === 0 ? 1 << this.bitPP : this.colors;

            this.palette = new Array(len);

            for (let i = 0; i < len; i++) {
                let blue = this.buffer.readUInt8(this.pos++);
                let green = this.buffer.readUInt8(this.pos++);
                let red = this.buffer.readUInt8(this.pos++);
                let quad = this.buffer.readUInt8(this.pos++);

                this.palette[i] = {
                    red: red,
                    green: green,
                    blue: blue,
                    quad: quad
                };
            }

            if (len === 1) {
                this.palette = new Array(256);

                for (let i = 0; i < 256; i ++) {
                    this.palette[i] = {
                        red: i,
                        green: i,
                        blue: i,
                        quad: 0
                    };
                }
            }
        }
    }

    parseBGR () {
        this.pos = this.offset;
        try {
            var bitn = "bit" + this.bitPP;
            var len = this.width * this.height * 4;
            this.data = new Buffer(len);

            if (this.array) bitn += 'Array';
            this[bitn]();
        } catch (e) {
            console.log("bit decode error:" + e);
        }
    }

    bit1 () {
        var xlen = Math.ceil(this.width / 8);
        var mode = xlen%4;
        for (var y = this.height - 1; y >= 0; y--) {
            for (var x = 0; x < xlen; x++) {
                var b = this.buffer.readUInt8(this.pos++);
                var location = y * this.width * 4 + x*8*4;
                for (var i = 0; i < 8; i++) {
                    if(x*8+i<this.width){
                        var rgb = this.palette[((b>>(7-i))&0x1)];
                        this.data[location+i*4] = rgb.blue;
                        this.data[location+i*4 + 1] = rgb.green;
                        this.data[location+i*4 + 2] = rgb.red;
                        this.data[location+i*4 + 3] = 0xFF;
                    }else{
                        break;
                    }
                }
            }

            if (mode != 0){
                this.pos+=(4 - mode);
            }
        }
    }

    bit4 () {
        var xlen = Math.ceil(this.width/2);
        var mode = xlen%4;
        for (var y = this.height - 1; y >= 0; y--) {
            for (var x = 0; x < xlen; x++) {
                var b = this.buffer.readUInt8(this.pos++);
                var location = y * this.width * 4 + x*2*4;

                var before = b>>4;
                var after = b&0x0F;

                var rgb = this.palette[before];
                this.data[location] = rgb.blue;
                this.data[location + 1] = rgb.green;
                this.data[location + 2] = rgb.red;
                this.data[location + 3] = 0xFF;

                if(x*2+1>=this.width)break;

                rgb = this.palette[after];
                this.data[location+4] = rgb.blue;
                this.data[location+4 + 1] = rgb.green;
                this.data[location+4 + 2] = rgb.red;
                this.data[location+4 + 3] = 0xFF;
            }

            if (mode != 0){
                this.pos+=(4 - mode);
            }
        }
    }

    bit8 () {
        var mode = this.width%4;

        for (var y = this.height - 1; y >= 0; y--) {

            for (var x = 0; x < this.width; x++) {
                var b = this.buffer.readUInt8(this.pos++);
                var location = y * this.width * 4 + x*4;

                if (b < this.palette.length) {
                    var rgb = this.palette[b];
                    this.data[location] = rgb.blue;
                    this.data[location + 1] = rgb.green;
                    this.data[location + 2] = rgb.red;
                    this.data[location + 3] = 0xFF;
                } else {
                    this.data[location] = 0xFF;
                    this.data[location + 1] = 0xFF;
                    this.data[location + 2] = 0xFF;
                    this.data[location + 3] = 0xFF;
                }
            }

            if (mode != 0){
                this.pos+=(4 - mode);
            }
        }
    }

    bit24 () {
        for (var y = this.height - 1; y >= 0; y--) {
            for (var x = 0; x < this.width; x++) {
                var blue = this.buffer.readUInt8(this.pos++);
                var green = this.buffer.readUInt8(this.pos++);
                var red = this.buffer.readUInt8(this.pos++);
                var location = (this.negative ? (this.height - y - 1) : y) * this.width * 4 + x * 4;
                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 0xFF;
            }

            this.pos += (this.width % 4);
        }
    }

    bit24Array () {
        this.pos = 0;

        for (var y = this.height - 1; y >= 0; y--) {
            for (var x = 0; x < this.width; x++) {
                var blue = this.array[this.pos++];
                var green = this.array[this.pos++];
                var red = this.array[this.pos++];

                var location = (this.negative ? (this.height - y - 1) : y) * this.width * 4 + x * 4;
                this.data[location] = red;
                this.data[location + 1] = green;
                this.data[location + 2] = blue;
                this.data[location + 3] = 0xFF;
            }
        }
    }

    getData () {
        return this.data;
    }
}


class Bitmap {
    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     * @returns {string}
     */
    static rgb2hex(red, green, blue) {
        var rgb = blue | (green << 8) | (red << 16);
        return '' + (0x1000000 + rgb).toString(16).slice(1)
    }

    /**
     * @param {string} hex
     * @returns {Array|null}
     */
    static hex2rgb(hex) {
        let r = hex.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (r) return r.slice(1,4).map(function(x) { return parseInt(x, 16); });
        return null;
    }

    /**
     * @param {number} n
     * @returns {string}
     */
    static int2hex(n) {
        return ('00000' + n.toString(16)).slice(-6);
    }

    /**
     * @param {string} hex
     * @returns {number}
     */
    static hex2int(hex) {
        return parseInt(hex, 16);
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     * @returns {number}
     */
    static rgb2int(red, green, blue) {
        return Bitmap.hex2int(Bitmap.rgb2hex(red, green, blue))
    }

    /**
     * @param {number} n
     * @returns {Array|null}
     */
    static int2rgb(n) {
        return Bitmap.hex2rgb(Bitmap.int2hex(n));
    }

    /**
     * @param {number} color1
     * @param {number} color2
     * @returns {number}
     */
    static getContrast(color1, color2) {
        var rgb1 = Bitmap.int2rgb(color1);
        var rgb2 = Bitmap.int2rgb(color2);

        let red1 = parseInt(rgb1[0]) / 255;
        let green1 = parseInt(rgb1[1]) / 255;
        let blue1 = parseInt(rgb1[2]) / 255;
        let lum1 = 0.2126 * red1 + 0.7152 * green1 + 0.0722 * blue1;

        let red2 = parseInt(rgb2[0]) / 255;
        let green2 = parseInt(rgb2[1]) / 255;
        let blue2 = parseInt(rgb2[2]) / 255;
        let lum2 = 0.2126 * red2 + 0.7152 * green2 + 0.0722 * blue2;

        return (lum1 < lum2) ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
    }

    /**
     * @param {Buffer} data
     * @returns {Bitmap}
     */
    static decode (data) {
        var decoder = new BmpDecoder(data);
        return new Bitmap(decoder.getData(), decoder.width, decoder.height);
    }

    /**
     * @param {Array} data
     * @param {number} width
     * @param {number} height
     * @param {number} [bpp]
     */
    static decodeArray(data, width, height, bpp) {
        var decoder = new BmpDecoder(data, true, width, height, bpp);
        return new Bitmap(decoder.getData(), decoder.width, decoder.height);
    }

    /**
     * @param {string} path
     * @param {function} callback
     */
    static open(path, callback) {
        Fs.readFile(path, function (error, data) {
            if (error) return callback(error);
            callback(null, Bitmap.decode(data));
        });
    }

    /**
     * @param {string} path
     * @returns {Bitmap}
     */
    static openSync(path) {
        return Bitmap.decode(Fs.readFileSync(path));
    }


    /**
     * @param {Array|Buffer} data
     * @param {number} width
     * @param {number} height
     */
    constructor(data, width, height) {
        this._data = data;
        this._width = width;
        this._height = height;
    }

    /**
     * @param {number} [quality]
     * @returns {Buffer}
     */
    encode (quality) {
        if (typeof quality === 'undefined') quality = 100;
        var encoder = new BmpEncoder(this);
        return encoder.encode();
    }

    /**
     * @param {string} path
     * @param {number} [quality]
     * @param {function} [callback]
     */
    save (path, quality, callback) {
        if (arguments.length === 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];
                quality = 100;
            }
        }

        Fs.writeFile(path, this.encode(quality), callback || (function () {}));
    }

    /**
     * @param {string} path
     * @param {number} [quality]
     */
    saveSync (path, quality) {
        return Fs.writeFileSync(path, this.encode(quality || 100));
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    get(x, y) {
        var location = y * this.width * 4 + x * 4;

        return Bitmap.rgb2int(
            this._data[location],
            this._data[location + 1],
            this._data[location + 2]
        );
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number|string} color
     */
    set (x, y, color) {
        var location = y * this.width * 4 + x * 4;

        let rgb = null;
        if (typeof color === 'string') rgb = Bitmap.hex2rgb(color);
        else rgb = Bitmap.int2rgb(color);
        if (!rgb) rgb = [0, 0, 0];

        this._data[location] = rgb[0];
        this._data[location + 1] = rgb[1];
        this._data[location + 2] = rgb[2];
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    crop (x, y, width, height) {
        var data = new Buffer(width * height * 4);

        for (let xi = 0; xi < width; xi ++) {
            for (let yi = 0; yi < height; yi ++) {
                var l1 = (y + yi) * this.width * 4 + (x + xi) * 4;
                var l2 = yi * width * 4 + xi * 4;

                data[l2] = this._data[l1];
                data[l2 + 1] = this._data[l1 + 1];
                data[l2 + 2] = this._data[l1 + 2];
                data[l2 + 3] = this._data[l1 + 3];
            }
        }

        return new Bitmap(data, width, height);
    }

    /**
     *
     */
    invert() {
        var data = new Buffer(this.width * this.height * 4);

        for (let x = 0; x < this.width; x ++) {
            for (let y = 0; y < this.height; y ++) {
                var l = y * this.width * 4 + x * 4;

                data[l] = 255 - this._data[l];
                data[l + 1] = 255 - this._data[l + 1];
                data[l + 2] = 255 - this._data[l + 2];
                data[l + 3] = 255 - this._data[l + 3];
            }
        }

        return new Bitmap(data, this.width, this.height);
    }

    /**
     * @param {number} color
     * @param {number} minContrast
     * @param {boolean} invert
     * @returns {Bitmap}
     */
    trimX(color, minContrast, invert) {
        var cropLeft = 0;
        var cropTop = 0;
        var cropRight = this._width - 1;
        var cropBottom = this._height - 1;

        for (let x = 0; x < this._width; x ++) {
            let empty = true;

            for (let y = 0; y < this._height; y ++) {
                let l = y * this._width * 4 + x * 4;

                if (!checkPixel(this._data, l, color, minContrast, invert)) {
                    empty = false;
                    break;
                }
            }

            if (empty) cropLeft = x + 1;
            else break;
        }

        for (let x = this._width - 1; x >= 0; x --) {
            let empty = true;

            for (let y = 0; y < this._height; y ++) {
                let l = y * this._width * 4 + x * 4;

                if (!checkPixel(this._data, l, color, minContrast, invert)) {
                    empty = false;
                    break;
                }
            }

            if (empty) cropRight = x - 1;
            else break;
        }

        return this.crop(cropLeft, cropTop, cropRight - cropLeft + 1, cropBottom - cropTop + 1);
    }

    /**
     * @param {number} color
     * @param {number} minContrast
     * @param {boolean} invert
     * @returns {Bitmap}
     */
    trimY(color, minContrast, invert) {
        var cropLeft = 0;
        var cropTop = 0;
        var cropRight = this._width - 1;
        var cropBottom = this._height - 1;

        for (let y = 0; y < this._height; y ++) {
            let empty = true;

            for (let x = 0; x < this._width; x ++) {
                let l = y * this._width * 4 + x * 4;

                if (!checkPixel(this._data, l, color, minContrast, invert)) {
                    empty = false;
                    break;
                }
            }

            if (empty) cropTop = y + 1;
            else break;
        }

        for (let y = this._height - 1; y >= 0; y --) {
            let empty = true;

            for (let x = 0; x < this._width; x ++) {
                let l = y * this._width * 4 + x * 4;

                if (!checkPixel(this._data, l, color, minContrast, invert)) {
                    empty = false;
                    break;
                }
            }

            if (empty) cropBottom = y - 1;
            else break;
        }

        return this.crop(cropLeft, cropTop, cropRight - cropLeft + 1, cropBottom - cropTop + 1);
    }

    /**
     * @param {number} color
     * @param {number} minContrast
     * @param {boolean} invert
     * @returns {Bitmap}
     */
    trim(color, minContrast, invert) {
        return this.trimY(color, minContrast, invert).trimX(color, minContrast, invert);
    }

    /**
     * @returns {Array}
     */
    get data() {
        return this._data;
    }

    /**
     * @returns {number}
     */
    get width() {
        return this._width;
    }

    /**
     * @returns {number}
     */
    get height() {
        return this._height;
    }
}

function checkPixel(data, l, color, minContrast, invert) {
    var pixelColor = Bitmap.rgb2int(data[l], data[l + 1], data[l + 2]);
    var contrast = Bitmap.getContrast(color, pixelColor);

    if (!invert) return (contrast >= minContrast);
    else return (contrast < minContrast);
}


module.exports = Bitmap;