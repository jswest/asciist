#!/usr/bin/env node

const path = require("path");

const yargs = require("yargs");

const args = yargs.argv;

const Degradr = require("./lib/Degradr");

const degradr = new Degradr();

degradr.run({
	charset: args.chars ? args.chars.split(",") : null,
	logLevel: args.log,
	inputFilePath:
		args.input[0] === "/"
			? args.input
			: path.join(process.cwd(), args.input),
	incriment: args.incriment || 50,
	maxPixelSize: args.max_pixel_size || 1000,
	minSize: args.min_size || 100,
	outputFilePath:
		args.output[0] === "/"
			? args.output
			: path.join(process.cwd(), args.output),
	size: args.size || 400
});
