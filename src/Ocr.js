'use strict';

var Fs = require('fs');
var Bitmap = require('./Bitmap');


class Ocr {
    static exportMap(bmp, color, minContrast) {
        bmp = bmp.trimX(color, minContrast, true);

        let width = bmp.width;
        let height = bmp.height;

        let char = [];

        for (let x = 0; x < width; x ++) {
            let column = [];
            for (let y = 0; y < height; y ++) {
                let pixelColor = bmp.get(x, y);

                if (pixelColor === color) {
                    column.push(1);
                } else {
                    if (Bitmap.getContrast(pixelColor, color) >= minContrast) column.push(2);
                    else column.push(0);
                }
            }

            char.push(column.join(''));
        }

        return char;
    }

    static createFont(dir, prefix, color, minContrast, height, spacingX, spacingY) {
        minContrast = minContrast || 1;
        var map = [];

        for (let i = 1; i < 10000; i ++) {
            let path = dir + '/' + prefix + i + '.bmp';
            if (!Fs.existsSync(path)) continue;

            let bmp = Bitmap.openSync(path);

            let cols = Ocr.exportMap(bmp, color, minContrast);
            if (!cols.length) continue;

            map.push({
                code: i,
                map: cols
            });
        }

        return {
            minContrast: minContrast,
            height: height,
            spacing: {
                x: spacingX,
                y: spacingY
            },
            map: map
        };
    }

    static saveFont(font, path, callback) {
        Fs.writeFile(path, JSON.stringify(font, null, 4), 'utf8', callback);
    }

    static saveFontSync(font, path) {
        Fs.writeFileSync(path, JSON.stringify(font, null, 4), 'utf8');
    }

    static openFont(path, callback) {
        Fs.readFile(path, 'utf8', (error, json) => {
            if (error) return callback(error);

            try {
                let font = JSON.parse(json);

                font.map.forEach((char) => {
                    char.size = char.map.length * char.map[0].length;
                });

                font.map.sort((a, b) => {
                    if (b.size != a.size) return b.size - a.size;
                    return a.code - b.code;
                });

                callback(null, font);
            } catch (e) {
                callback(e);
            }
        });
    }

    static openFontSync(path) {
        let font = JSON.parse(Fs.readFileSync(path, 'utf8'));

        font.map.forEach((char) => {
            char.size = char.map.length * char.map[0].length;
        });

        font.map.sort((a, b) => {
            if (b.size != a.size) return b.size - a.size;
            return a.code - b.code;
        });

        return font;
    }



    //



    static read(bmp, font, color, minContrast) {
        color = color || 0;

        let spacing = font['spacing'];
        minContrast = minContrast || font['minContrast'];

        let width = bmp.width;
        let height = bmp.height;
        var text = '';

        // Split the rows first
        let rows = [];
        let currentRow = null;
        let emptyStreak = 0;
        let nonEmptyStreak = 0;

        for (let y = 0; y < height; y ++) {
            let empty = true;

            for (let x = 0; x < width; x ++) {
                if (Bitmap.getContrast(bmp.get(x, y), color) >= minContrast) {
                    empty = false;
                    break;
                }
            }

            if (empty) {
                emptyStreak ++;
                nonEmptyStreak = 0;
            } else {
                if (nonEmptyStreak === 0 && emptyStreak >= spacing.y) {
                    if (currentRow !== null) {
                        let tmp = bmp.crop(0, currentRow, width, y - currentRow);
                        if (tmp.height < 6 && rows.length) {
                            rows[rows.length - 1] = new Bitmap(Buffer.concat([rows[rows.length - 1].data, tmp.data]), width, rows[rows.length - 1].height + tmp.height);
                        } else {
                            rows.push(tmp);
                        }
                    }

                    currentRow = y - emptyStreak;
                }

                emptyStreak = 0;
                nonEmptyStreak ++;
            }
        }

        if (nonEmptyStreak === 0 && currentRow !== null) {
            let tmp = bmp.crop(0, currentRow, width, height - currentRow);
            if (tmp.height < 6 && rows.length) {
                rows[rows.length - 1] = new Bitmap(Buffer.concat([rows[rows.length - 1].data, tmp.data]), width, rows[rows.length - 1].height + tmp.height);
            } else {
                rows.push(tmp);
            }
        }

        let chars = [];

        // Split all chars in every row
        rows.forEach(function(row, ri) {
            let cols = [];
            let currentCol = null;
            let emptyStreak = 0;
            let nonEmptyStreak = 0;

            let width = row.width;
            let height = row.height;

            for (let x = 0; x < width; x ++) {
                let empty = true;

                for (let y = 0; y < height; y ++) {
                    if (Bitmap.getContrast(row.get(x, y), color) >= minContrast) {
                        empty = false;
                        break;
                    }
                }

                if (empty) {
                    emptyStreak ++;
                    nonEmptyStreak = 0;
                } else {
                    if (nonEmptyStreak === 0 && emptyStreak >= spacing.x) {
                        if (currentCol !== null) {
                            let c = row.crop(currentCol, 0, x - currentCol, height);

                            let _space = 0;
                            for (let _x = c.width - 1; _x >= 0; _x --) {
                                let _empty = true;

                                for (let _y = c.height - 1; _y >= 0; _y --) {
                                    if (c.get(_x, _y) === color) {
                                        _empty = false;
                                        break;
                                    }
                                }

                                if (_empty) _space ++;
                                else break;
                            }

                            cols.push(Ocr.exportMap(c, color, minContrast));
                            if (_space >= 4) cols.push(null);
                        }

                        currentCol = x;
                    }

                    emptyStreak = 0;
                    nonEmptyStreak ++;
                }
            }

            if (currentRow !== null) {
                let c = row.crop(currentCol, 0, width - currentCol, height);
                cols.push(Ocr.exportMap(c, color, minContrast));
            }

            chars.push(cols);
        });

        let count = 0;
        chars.forEach((row, i) => {
            row.forEach((group, i) => {
                if (group === null) {
                    text += ' ';
                    return;
                }

                for (let cnt = 0; cnt < 100 && group.length; cnt ++) {
                    var found = false;

                    font.map.every((char) => {
                        let y = lookupChar(char.map, group);

                        if (y !== null) {
                            text += String.fromCharCode(char.code);
                            found = true;

                            for (let i = 0, l = char.map.length; i < l; i ++) group.shift();
                            while (group[0] && group[0].indexOf('1') === -1 && group[0].indexOf('2') === -1) group.shift();

                            return false;
                        }

                        return true;
                    });

                    if (found) count ++;
                    else cnt= 1000;
                }
            });

            text += '\n';
        });

        return text;
    }
}


function lookupChar(charCols, cols, sx, maxY) {
    if (cols.length < charCols.length) return null;

    cols = cols.map((col) => '0'.repeat(16) + col + '0'.repeat(16));
    
    if (cols[0].length < charCols[0].length) return null;

    sx = sx || 0;

    if (maxY === null || (typeof maxY === 'undefined')) maxY = cols[0].length - charCols[0].length;

    var result = null;

    for (let sy = 0; sy <= maxY; sy ++) {
        let match = true;

        for (let x = sx, l = charCols.length; x < l; x ++) {
            let charCol = '0'.repeat(sy) + charCols[x - sx] + '0'.repeat(cols[0].length - charCols[0].length - sy);
            let col = cols[x];

            if (charCol !== col) {
                match = false;
                break;
            }
        }

        if (match) {
            result = sy;
            break;
        }
    }

    return result;
}


module.exports = Ocr;