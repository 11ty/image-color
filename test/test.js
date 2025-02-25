import test from "ava";
// getImageColors persists to disk, getImageColorsRaw does not
import { getImageColors, getImageColorsRaw } from "../image-color.js";

// https://unsplash.com/photos/a-tall-building-with-a-sky-background-I5eKsDa8iwY
test("Tall building", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.deepEqual(colors.map(c => c.colorjs.toString({format: "hex"})), ["#305e5a", "#94a7b4", "#e0dee1", "#021a1e"]);
});

test("Tall building (original prop)", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.deepEqual(colors.map(c => c.original), ["#305e5a", "#94a7b4", "#e0dee1", "#021a1e"]);
});

test("P", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.deepEqual(Object.keys(colors[0]).sort(), ["background", "colorjs", "contrast", "foreground", "mode", "original", "toString"]);
});

test("toString()", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.deepEqual(colors.map(c => ""+c), [
		"oklch(44.796% 0.05118 188.19)",
		"oklch(71.786% 0.02854 237.76)",
		"oklch(90.302% 0.00457 314.8)",
		"oklch(20.059% 0.03184 209.56)",
	]);
});

test("Filtering", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.deepEqual(colors.filter(c => {
		return c.colorjs.oklch.l > .1 && c.colorjs.oklch.l < .9;
	}).map(c => c.original), ["#305e5a", "#94a7b4", "#021a1e"]);
});

test("Memoization (uses disk cache)", async t => {
	let colors1 = getImageColorsRaw("./test/test.jpg");
	let colors2 = getImageColorsRaw("./test/test.jpg");
	t.is(colors1, colors2);

	let results = await Promise.all([colors1, colors2]);
	t.is(results[0], results[1]);
});
