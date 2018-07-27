#!/usr/bin/env node

const fs = require('fs');

const d3 = require('d3');
const Png = require('pngjs').PNG;
const sharp = require('sharp');
const yargs = require('yargs');

const args = yargs.argv;
const chars = [' ', '░', '▒', '▓', '█'].reverse();

if (args.inverse) {
	chars.reverse();
}

sharp(args.input)
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
			for (let y = 0; y < this.height; y++) {
				let index = (this.width * y + x) << 2;

				const gray =
					this.data[index] +
					this.data[index + 1] +
					this.data[index + 2] / 3;

				this.data[index] = gray;
				this.data[index + 1] = gray;
				this.data[index + 2] = gray;

				pixelValues.push(gray);
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
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				let index = (this.width * y + x) << 2;
				for (let i = 0; i < bins.length; i++) {
					let bin = bins[i];
					if (
						this.data[index] >= bin.x0 &&
						this.data[index] <= bin.x1
					) {
						output += chars[i] + chars[i];
						break;
					}
				}
			}
			output += '\n';
		}
		fs.writeFileSync(args.output, output);
	});
