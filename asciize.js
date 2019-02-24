#!/usr/bin/env node

const path = require("path");

const yargs = require("yargs");

const argv = yargs.argv;

const Asciist = require("./lib/Asciist");

const input = argv._[0];
const output = argv._[1];

const asciist = new Asciist({
	chars: argv.chars ? argv.chars.split(",") : null,
	inputFilePath: input[0] === "/" ? input : path.join(process.cwd(), input),
	invert: argv.invert,
	maxAsciiSize: argv.size || 100,
	maxFinalImageSize: argv.image_size || 500,
	outputFilePath:
		output[0] === "/" ? output : path.join(process.cwd(), output),
	saveAsImage: !argv.save_as_text
});
asciist.run();
