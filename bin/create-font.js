#!/usr/bin/env node

'use strict';

const Fs = require('fs');
const Path = require('path');
const Program = require('commander');
const Ocr = require('../src/Ocr');


Program
    .version(JSON.parse(Fs.readFileSync('../package.json', 'utf8')).version, '-v, --version')
    .option('-d, --dir [dir]', 'BMP files directory', (a) => a, process.cwd())
    .option('-p, --prefix [prefix]', 'BMP files prefix', (a) => a, '')
    .option('-c, --color [color]', 'Color [000000]', (a) => a, '000000')
    .option('-s, --save [path]', 'Save path', (a) => a, '')
    .parse(process.argv);


var path = Path.resolve(process.cwd(), Program['save']);
var dir = Path.resolve(process.cwd(), Program['dir']);


if (Program['save']) Ocr.saveFontSync(Ocr.createFont(dir, Program['prefix'], parseInt(Program['color'], 16)), path);
else console.log(JSON.stringify(Ocr.createFont(dir, Program['prefix'], parseInt(Program['color'], 16)), null, 4));