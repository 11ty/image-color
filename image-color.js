import memoize from "memoize";
import Color from "colorjs.io";
import getPixels from "@zachleat/get-pixels";
import { extractColors } from "extract-colors";
import Cache from "@11ty/eleventy-fetch";
import Image from "@11ty/eleventy-img";

export function memoizeJsonToDisk(fn, options = {}) {
	return memoize(function(arg) {
		return Cache(async () => fn(arg), Object.assign({
			type: "json",
			duration: "1d",
			requestId: `11ty/image-color/${arg}`,
		}, options)).then(colors => {
			// Color instances are not JSON-friendly
			for(let c of colors) {
				c.colorjs = new Color(c.original);
			}

			return colors;
		});
	});
}

export async function getImage(source) {
	return Image(source, {
		formats: ["png"],
		widths: [50],
		dryRun: true,
	});
}

export async function getColors(source) {
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

// no disk cache, but keep in-memory memoize (will read from disk if available!)
export function getImageColorsRaw(source) {
	return rawFn(source);
}
