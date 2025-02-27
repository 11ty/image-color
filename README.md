# `@11ty/image-color`

A small utility to efficiently extract color information from images (with a memoization and a disk-cache). Requires Node 18 or newer.

## Installation

Install from [npm: `@11ty/image-color`](https://www.npmjs.com/package/@11ty/image-color):

```sh
npm install @11ty/image-color
```

Based on the great work of [`get-pixels`](https://www.npmjs.com/package/get-pixels/) (via the [`@zachleat/get-pixels` fork](https://github.com/zachleat/get-pixels)) and [`extract-colors`](https://www.npmjs.com/package/extract-colors).

## Usage

```js
import { getImageColors } from "@11ty/image-color";

// Returns an array of color objects
let colors = await getImageColors("./sample.jpg");

// Works with local or remote images
// let colors = await getImageColors("https://example.com/sample.jpg");

// Get oklch string values
colors.map(c => c.background);

// Get hex values
colors.map(c => c.colorjs.toString({format: "hex"}));

// Filter colors based on Lightness value
colors.filter(c => c.colorjs.oklch.l > .1);

// Sort Lightest colors first
colors.sort((a, b) => {
	return b.colorjs.oklch.l - a.colorjs.oklch.l;
})
```

Learn more about [color.js Color objects](https://colorjs.io/docs/the-color-object).

### Returns

An array of colors in the image, with the following properties:

```js
[{
	background, // oklch color string (you probably want this)
	foreground, // accessible color for text on top

	colorjs, // colorjs.io Color object

	mode, // one of "dark" or "light", based on WCAG21 contrast versus #000 or #fff
	contrast: {
		light, // WCAG21 contrast color (number) versus white (#fff) (4.5+ is good)
		dark, // WCAG21 contrast color (number) versus black (#000) (4.5+ is good)
	},

	toString(), // returns same as `background`
}]
```

Learn more about [color.js Color objects](https://colorjs.io/docs/the-color-object).
