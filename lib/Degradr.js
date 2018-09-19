const { exec } = require("child_process");
const fs = require("fs");

const gm = require("gm").subClass({ imageMagick: true });

const Asciist = require("./Asciist");

module.exports = class Degradr {
	run(options) {
		gm(options.inputFilePath)
			.resize(options.maxPixelSize, options.maxPixelSize)
			.write(options.inputFilePath, err => {
				const asciist = new Asciist();
				const sizes = [];
				for (
					let i = options.size, p = Promise.resolve();
					i >= options.minSize;
					i -= options.incriment
				) {
					sizes.push(i);
				}
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
							if (options.logLevel >= 1) {
								console.log(fileName);
							}
							fileNames.push(fileName);
							asciist
								.run({
									charset: options.charset,
									logLevel: options.log,
									inputFilePath: options.inputFilePath,
									incriment: options.incriment || 50,
									invert: options.invert,
									logLevel: options.logLevel,
									outputFilePath: fileName,
									shouldSaveAsImage: true,
									size: sizes[i]
								})
								.then(() => {
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
							}x${options.maxPixelSize} ${fileNames.join(" ")} ${
								options.outputFilePath
							}`,
							err => {
								fileNames.forEach(fn => {
									fs.unlinkSync(fn);
								});
							}
						);
					}
				})(0);
			});
	}
};
