import memoize from "memoize";
import PQueue from 'p-queue';
import Color from "colorjs.io";
import debugUtil from "debug";
import { PNG } from "pngjs";
import ndarray from "ndarray";
import { extractColors } from "extract-colors";
import Cache from "@11ty/eleventy-fetch";
import Image from "@11ty/eleventy-img";

const debug = debugUtil("Eleventy:ImageColor");
const queue = new PQueue({ concurrency: 10 });

queue.on("active", () => {
	debug("Size: %o  Pending: %o", queue.size, queue.pending);
});

export async function getImage(source) {
	return Image(source, {
		// PNG is important here
		formats: ["png"],
		widths: [50],
		dryRun: true,
	});
}

// Thanks to `get-pixels` https://www.npmjs.com/package/get-pixels
async function handlePNG(data) {
  var png = new PNG();
	return new Promise((resolve, reject) => {
		png.parse(data, function(err, img_data) {
			if(err) {
				reject(err);
			} else {
				resolve(ndarray(new Uint8Array(img_data.data),
					[img_data.width|0, img_data.height|0, 4],
					[4, 4*img_data.width|0, 1],
					0))
			}
		})
	})
}

// just for backwards compat, doesn’t use disk cache or memoization layer or concurrency queue
export async function getColors(source) {
	let stats = await getImage(source);
	debug("Image fetched: %o", source);

	return getColorsFromBuffer(stats.png[0].buffer);
}

async function getColorsFromBuffer(buffer) {
	let pixels = await handlePNG(buffer);
	let data = [...pixels.data];
	let [width, height] = pixels.shape;

	let colors = await extractColors({ data, width, height });

	return colors.map(colorData => {
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
	}).filter(entry => Boolean(entry));
}

export function getQueuedFunction(options = {}) {
	return memoize(async function(source) {
		debug("Fetching: %o", source);

		// This *needs* to be outside of Cache so it doesn’t have conflicting concurrency queues.
		let stats = await getImage(source);
		debug("Image fetched: %o", source);

		let buffer = stats.png[0].buffer;

		// Add to concurrency queue
		return queue.add(() => Cache(async () => {
			return getColorsFromBuffer(buffer);
		}, Object.assign({
			type: "json",
			duration: "1d",
			requestId: `11ty/image-color/${source}`,
		}, options.cacheOptions)).then(colors => {
			// Color instances are not JSON-friendly
			for(let c of colors) {
				c.colorjs = new Color(c.original);
			}

			return colors;
		}));
	});
}

let fn = getQueuedFunction();
let rawFn = getQueuedFunction({ cacheOptions: { dryRun: true } });

export function getImageColors(source) {
	return fn(source);
}

// no disk cache, but keep in-memory memoize (will read from disk if available!)
export function getImageColorsRaw(source) {
	return rawFn(source);
}
