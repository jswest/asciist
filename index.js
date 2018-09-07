#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { createCanvas, loadImage } = require("canvas");
const d3 = require("d3");
const Png = require("pngjs").PNG;
const sharp = require("sharp");
const yargs = require("yargs");

const args = yargs.argv;
const standardChars = [" ", "░", "▒", "▓", "█"];
const elonChars = [" ", "l", "o", "E", "N"];

const inputPath =
	args.input[0] === "/" ? args.input : path.join(process.cwd(), args.input);
const outputPath =
	args.output[0] === "/"
		? args.output
		: path.join(process.cwd(), args.output);

let chars = args.character_set === "elon" ? elonChars : standardChars;

if (args.invert) {
	chars.reverse();
}

sharp(inputPath)
	.resize(args.size || 100, args.size || 100)
	.max()
	.toFormat("png")
	.pipe(
		new Png({
			filterType: 4
		})
	)
	.on("parsed", function() {
		let pixelValues = [];
		for (let y = 0; y < this.height; y++) {
			pixelValues[y] = [];
			for (let x = 0; x < this.width; x++) {
				let index = (this.width * y + x) << 2;
				const gray =
					(this.data[index] +
						this.data[index + 1] +
						this.data[index + 2]) /
					3;
				pixelValues[y].push(gray);
			}
		}
		let bins = d3
			.histogram()
			.thresholds(chars.length)
			.domain([0, 255])(pixelValues)
			.map(d => {
				return { x0: d.x0, x1: d.x1 };
			})
			.sort((a, b) => {
				return a.x0 < b.x0 ? 1 : -1;
			});

		let output = "";
		for (let y = 0; y < pixelValues.length; y++) {
			for (let x = 0; x < pixelValues[y].length; x++) {
				for (let i = 0; i < bins.length; i++) {
					let bin = bins[i];
					if (
						pixelValues[y][x] >= bin.x0 &&
						pixelValues[y][x] <= bin.x1
					) {
						output += chars[i] + chars[i];
						break;
					}
				}
			}
			output += "\n";
		}
		if (args.save_as_image) {
			const outputValues = output.split("\n");
			const width = 9.5 * outputValues[0].length;
			const height = 20 * outputValues.length;
			const canvas = createCanvas(width, height);
			const context = canvas.getContext("2d");

			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, width, height);

			context.font = "16px/16px Menlo";
			for (let y = 0; y < outputValues.length; y++) {
				context.fillStyle = "#000000";
				context.fillText(outputValues[y], 0, y * 20 + 20);
				if (args.log) {
					console.log(outputValues[y]);
				}
			}
			canvas.createPNGStream().pipe(fs.createWriteStream(outputPath));
		} else {
			fs.writeFileSync(outputPath, output);
		}
	});
