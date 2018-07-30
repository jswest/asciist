#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { createCanvas, loadImage } = require('canvas');
const d3 = require('d3');
const Png = require('pngjs').PNG;
const sharp = require('sharp');
const yargs = require('yargs');

const args = yargs.argv;
const chars = [' ', '░', '▒', '▓', '█'];

const inputPath = args.input[0] === '/' ? args.input : path.join(__dirname, args.input);
const outputPath = args.output[0] === '/' ? args.output : path.join(__dirname, args.output);

if (args.invert) {
	chars.reverse();
}

sharp(inputPath)
	.resize(args.size || 100, args.size || 100)
	.max()
	.toFormat('png')
	.pipe(
		new Png({
			filterType: 4,
		})
	)
	.on('parsed', function() {
		let pixelValues = [];
		for (let x = 0; x < this.width; x++) {
			pixelValues[x] = [];
			for (let y = 0; y < this.height; y++) {
				let index = (this.width * y + x) << 2;
				const gray = (this.data[index] + this.data[index + 1] + this.data[index + 2]) / 3;
				pixelValues[x].push(gray);
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

		let output = '';
		for (let x = 0; x < pixelValues.length; x++) {
			for (let y = 0; y < pixelValues[x].length; y++) {
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
			output += '\n';
		}
		if (args.save_image) {
			const outputValues = output.split('\n');
			const width = 9.5 * outputValues[0].length;
			const height = 20 * outputValues.length;
			const canvas = createCanvas(width, height);
			const context = canvas.getContext('2d');

			context.font = '16px/16px Menlo';
			for (let x = 0; x < outputValues.length; x++) {
				context.fillText(outputValues[x], 0, x * 20 + 20);
				if (args.log) {
					console.log(outputValues[x]);
				}
			}
			canvas.createPNGStream().pipe(fs.createWriteStream(outputPath));
		} else {
			fs.writeFileSync(outputPath, output);
		}

	});
