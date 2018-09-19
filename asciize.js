#!/usr/bin/env node

const path = require("path");

const yargs = require("yargs");

const args = yargs.argv;

const Asciist = require("./lib/Asciist");

const asciist = new Asciist();
asciist.run({
	charset: args.chars ? args.chars.split(",") : null,
	logLevel: args.log,
	inputFilePath:
		args.input[0] === "/"
			? args.input
			: path.join(process.cwd(), args.input),
	incriment: args.incriment || 50,
	invert: args.invert,
	outputFilePath:
		args.output[0] === "/"
			? args.output
			: path.join(process.cwd(), args.output),
	shouldSaveAsImage: args.save_as_image,
	size: args.size || 100
});
