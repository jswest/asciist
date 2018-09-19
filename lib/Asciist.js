const fs = require("fs");

const { createCanvas, loadImage } = require("canvas");
const d3 = require("d3");
const Png = require("pngjs").PNG;
const sharp = require("sharp");

module.exports = class Asciist {
	constructor() {}

	run(options) {
		console.log("Running...");
		// }
		const { charset, invert } = options;
		const chars =
			Array.isArray(charset) && charset.length > 0
				? charset
				: this.standardChars;
		if (invert) {
			chars.reverse();
		}
		options.chars = chars;
		return new Promise((resolve, reject) => {
			resolve(
				this.getAscii(options)
					.then(this.save.bind(this))
					.catch(err => {
						console.log(err);
					})
			);
		});
	}

	get standardChars() {
		return [" ", "░", "▒", "▓", "█"];
	}

	getAscii(options) {
		const { chars, inputFilePath, size } = options;
		return new Promise((resolve, reject) => {
			sharp(inputFilePath)
				.resize(size, size)
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
					if (output !== "") {
						options.output = output;
						resolve(options);
					} else {
						reject();
					}
				});
		});
	}

	writeStreamToFile(outputFilePath, resolve, reject) {
		return fs
			.createWriteStream(outputFilePath)
			.on("finish", () => {
				resolve();
			})
			.on("error", () => {
				reject();
			});
	}

	saveAsImage(options) {
		const { logLevel, output, outputFilePath } = options;
		return new Promise((resolve, reject) => {
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
				if (logLevel === 2) {
					console.log(outputValues[y]);
				}
			}
			canvas
				.createPNGStream()
				.pipe(this.writeStreamToFile(outputFilePath, resolve, reject));
		});
	}

	saveAsText(options) {
		const { output, outputFilePath } = options;
		return new Promise((resolve, reject) => {
			fs.writeFile(outputFilePath, output, error => {
				if (error) {
					reject();
				} else {
					resolve();
				}
			});
		});
	}
	save(options) {
		const { shouldSaveAsImage } = options;
		return new Promise((resolve, reject) => {
			if (shouldSaveAsImage) {
				resolve(this.saveAsImage(options));
			} else {
				resolve(this.saveAsText(options));
			}
			reject();
		});
	}
};
