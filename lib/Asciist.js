const fs = require("fs");

const { createCanvas, loadImage, registerFont } = require("canvas");
const sharp = require("sharp");

class Asciist {
	constructor(options) {
		registerFont(`${__dirname}/FreeMono.ttf`, {
			family: "FreeMono"
		});
		this.state = options;
		this.state.maxAsciiHeight =
			this.state.maxAsciiHeight || options.maxAsciiSize || 100;
		this.state.maxAsciiWidth =
			this.state.maxAsciiWidth || options.maxAsciiSize || 100;
		this.state.maxFinalImageHeight =
			this.state.maxFinalImageHeight || options.maxFinalImageSize || 1000;
		this.state.maxFinalImageWidth =
			this.state.maxFinalImageWidth || options.maxFinalImageSize || 1000;
		this.state.saveAsImage =
			this.state.saveAsImage === undefined
				? true
				: this.state.saveAsImage;
		this.state.chars = this.state.chars || [" ", "░", "▒", "▓", "█"];
	}

	handleImageMetadata(metadata) {
		const {
			maxAsciiHeight,
			maxAsciiWidth,
			maxFinalImageHeight,
			maxFinalImageWidth
		} = this.state;
		return new Promise((resolve, reject) => {
			const asciiRatios = [
				maxAsciiWidth / metadata.width,
				maxAsciiHeight / metadata.height
			];
			const asciiRatio = Math.min(asciiRatios[0], asciiRatios[1]);
			this.state.asciiHeight = Math.round(metadata.height * asciiRatio);
			this.state.asciiWidth = Math.round(metadata.width * asciiRatio);

			const imageRatios = [
				maxFinalImageWidth / metadata.width,
				maxFinalImageHeight / metadata.height
			];
			const imageRatio = Math.min(imageRatios[0], imageRatios[1]);
			this.state.finalHeight = Math.round(metadata.height * imageRatio);
			this.state.finalWidth = Math.round(metadata.width * imageRatio);
			resolve();
		});
	}

	handleImageBuffer(data) {
		const { asciiHeight, asciiWidth } = this.state;
		return new Promise((resolve, reject) => {
			const pixels = [];
			for (let i = 0, l = data.length; i < l; i += 3) {
				pixels.push([data[i], data[i + 1], data[i + 2]]);
			}
			const rawGrayPixels = pixels.map(
				p => p.reduce((a, c) => (a += c), 0) / 3
			);
			let index = 0;
			let grayPixels = [];
			for (let y = 0; y < asciiHeight; y++) {
				grayPixels.push([]);
				for (let x = 0; x < asciiWidth; x++) {
					grayPixels[y].push(rawGrayPixels[index]);
					index++;
				}
			}
			this.state.pixels = grayPixels;
			resolve();
		});
	}

	binPixels() {
		const { invert } = this.state;
		return new Promise((resolve, reject) => {
			const { chars, pixels } = this.state;
			const interval = 255 / chars.length;
			const bins = [];
			let counter = 0;
			while (counter < 255) {
				bins.push({
					x0: counter,
					x1: Math.floor(counter + interval)
				});
				counter += Math.ceil(interval);
			}
			if (!invert) {
				bins.reverse();
			}
			this.state.bins = bins;
			resolve();
		});
	}

	asciizeImage() {
		const { bins, chars, pixels } = this.state;
		return new Promise((resolve, reject) => {
			let outputString = "";
			for (let y = 0; y < pixels.length; y++) {
				for (let x = 0; x < pixels[y].length; x++) {
					for (let i = 0; i < bins.length; i++) {
						const bin = bins[i];
						const p = pixels[y][x];
						if (p >= bin.x0 && p <= bin.x1) {
							outputString += `${chars[i]}${chars[i]}`;
							break;
						}
					}
				}
				outputString += "\n";
			}
			this.state.outputString = outputString;
			resolve();
		});
	}

	writeToFile() {
		const {
			finalHeight,
			finalWidth,
			outputFilePath,
			outputString,
			saveAsImage
		} = this.state;
		return new Promise((resolve, reject) => {
			if (saveAsImage) {
				const rows = outputString.split("\n");
				const canvasHeight = 20 * rows.length;
				const canvasWidth = 9.5 * rows[0].length;
				const canvas = createCanvas(canvasWidth, canvasHeight, "png");
				const context = canvas.getContext("2d");
				context.fillStyle = "#ffffff";
				context.fillRect(0, 0, canvasWidth, canvasHeight);
				context.fillStyle = "#000000";
				context.font = "16px/16px 'FreeMono' monospace";
				rows.forEach((r, i) => {
					context.fillText(r, 0, i * 20 + 20);
				});
				const buff = canvas.toBuffer();
				const image = sharp(buff)
					.resize(finalWidth, finalHeight, { fit: "fill" })
					.toFormat("png")
					.toFile(outputFilePath)
					.then(resolve)
					.catch(err => reject(err));
			} else {
				fs.writeFile(outputFilePath, outputString, err => {
					err ? reject() : resolve();
				});
			}
		});
	}

	run() {
		const { inputFilePath } = this.state;
		return new Promise((resolve, reject) => {
			const image = sharp(inputFilePath);
			image
				.metadata()
				.then(this.handleImageMetadata.bind(this))
				.then(() => {
					const { asciiHeight, asciiWidth } = this.state;
					return image
						.resize(asciiWidth, asciiHeight)
						.toFormat("jpg")
						.raw()
						.toBuffer()
						.then(this.handleImageBuffer.bind(this))
						.then(this.binPixels.bind(this))
						.then(this.asciizeImage.bind(this))
						.then(this.writeToFile.bind(this))
						.then(resolve)
						.catch(err => reject(err));
				})
				.catch(err => reject(err));
		});
	}
}

module.exports = Asciist;
