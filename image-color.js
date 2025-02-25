import getPixels from "@zachleat/get-pixels";
import { extractColors } from "extract-colors";
import Cache from "@11ty/eleventy-fetch";
import Image from "@11ty/eleventy-img";
import Color from "colorjs.io";

function memoizeJsonToDisk(fn, options = {}) {
	return function(arg) {
		return Cache(async () => fn(arg), Object.assign({
			type: "json",
			duration: "1d",
			requestId: `11ty/image-color/${arg}`,
		}, options));
	};
}

export async function getImage(source) {
	return Image(source, {
		formats: ["png"],
		widths: [50],
		dryRun: true,
	});
}

async function getColors(source) {
	return new Promise(async (resolve, reject) => {
		let stats = await getImage(source);

		getPixels(stats.png[0].buffer, "image/png", (err, pixels) => {
			if(err) {
				reject(err);
			} else {
				let data = [...pixels.data];
				let [width, height] = pixels.shape;
				extractColors({ data, width, height }).then(colors => {
					resolve(colors.map(colorData => {
						let c = new Color(colorData.hex);

						let contrastDark = c.contrast("#000", "WCAG21");
						let contrastLight = c.contrast("#fff", "WCAG21");

						let alternate;
						let mode = "unknown";
						if(contrastDark > 4.5) {
							// contrasts well with #000
							alternate = "#000"; // text is black
							mode = "light";
						} else if(contrastLight > 4.5) {
							// contrasts well with #fff
							alternate = "#fff"; // text is white
							mode = "dark";
						}

						return {
							colorjs: c,
							original: colorData.hex,
							background: ""+c.to("oklch"),
							foreground: alternate,

							mode,
							contrast: {
								light: contrastLight,
								dark: contrastDark,
							},

							toString() {
								return ""+c.to("oklch");
							}
						}
					}).filter(entry => Boolean(entry)));
				}, reject);
			}
		});
	});
}

let fn = memoizeJsonToDisk(getColors);
let rawFn = memoizeJsonToDisk(getColors, { dryRun: true });

export function getImageColors(source) {
	return fn(source);
}

// no disk cache, but keep in-memory memoize
export function getImageColorsRaw(source) {
	return rawFn(source);
}
