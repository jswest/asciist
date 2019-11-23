const { exec } = require("child_process");
const fs = require("fs");
const d3 = require("d3");

const gm = require("gm").subClass({ imageMagick: true });

const Asciist = require("./Asciist");

module.exports = class Degradr {
	run(options) {
		let width, height;
		let { colorRange } = options;
		if (!colorRange) {
			colorRange = ["black", "black"];
		}
		return new Promise((res, rej) => {
			gm(options.inputFilePath)
				.resize(options.maxPixelSize, options.maxPixelSize)
				.size((err, size) => {
					width = size.width;
					height = size.height;
				})
				.write(options.inputFilePath, err => {
					let sizes = [];
					if (options.sizes) {
						sizes = options.sizes;
					} else {
						for (
							let i = options.size, p = Promise.resolve();
							i >= options.minSize;
							i -= options.incriment
						) {
							sizes.push(i);
						}
					}
					const colorScale = d3
						.scaleLinear()
						.domain([sizes[0], sizes[sizes.length - 1]])
						.range(colorRange);
					const fileNames = [];
					let index = 0;
					(function loop(i) {
						if (i < sizes.length) {
							return new Promise((resolve, reject) => {
								const baseFilePath = options.inputFilePath.split(
									".png"
								)[0];
								const fileName = `${baseFilePath}-${(
									"00" + index
								).slice(-3)}.png`;
								fileNames.push(fileName);
								const asciist = new Asciist({
									chars: options.chars,
									color: colorScale(sizes[i]),
									inputFilePath: options.inputFilePath,
									incriment: options.incriment || 50,
									invert: options.invert,
									outputFilePath: fileName,
									maxAsciiSize: sizes[i]
								});
								asciist.run().then(() => {
									resolve();
								});
								index++;
							})
								.then(loop.bind(null, i + 1))
								.catch(err => {
									console.log(err);
								});
						} else {
							exec(
								`convert -loop 0 -delay 30 -scale ${
									options.maxPixelSize
								}x${options.maxPixelSize} ${fileNames.join(
									" "
								)} ${options.outputFilePath}`,
								err => {
									if (!options.shouldNotDelete) {
										fileNames.forEach(fn => {
											fs.unlinkSync(fn);
										});
									}
									res();
								}
							);
						}
					})(0);
				});
		});
	}
};
