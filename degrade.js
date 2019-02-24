#!/usr/bin/env node

const path = require("path");

const yargs = require("yargs");

const args = yargs.argv;

const Degradr = require("./lib/Degradr");

const degradr = new Degradr();

const input = args._[0];
const output = args._[1];

degradr.run({
	chars: args.chars ? args.chars.split(",") : null,
	inputFilePath: input[0] === "/" ? input : path.join(process.cwd(), input),
	maxPixelSize: args.max_pixel_size || 1000,
	minSize: args.min_size || 100,
	outputFilePath:
		output[0] === "/" ? output : path.join(process.cwd(), output),
	shouldNotDelete: args.should_not_delete || false,
	sizes: args.sizes
		? args.sizes.split(",").map(s => +s)
		: [
				350,
				300,
				250,
				210,
				170,
				140,
				110,
				90,
				70,
				60,
				50,
				45,
				40,
				35,
				30,
				25,
				20,
				15,
				10,
				9,
				8,
				7,
				6,
				5,
				4,
				3,
				2,
				1
		  ]
});
