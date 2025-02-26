import test from "ava";
import Color from "colorjs.io";
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

test("Prop check", async t => {
	let colors = await getImageColorsRaw("./test/test.jpg");
	t.true(colors[0].colorjs instanceof Color);
	t.is(typeof colors[0].background, "string");
	t.is(typeof colors[0].contrast.dark, "number");
	t.is(typeof colors[0].contrast.light, "number");
	t.is(typeof colors[0].foreground, "string");
	t.is(typeof colors[0].mode, "string");
	t.true(["dark", "light"].includes(colors[0].mode));
	t.is(typeof colors[0].original, "string");
	t.true(colors[0].toString().startsWith("oklch("));
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

test("Memoization (raw)", async t => {
	let colors1 = getImageColorsRaw("./test/test.jpg");
	let colors2 = getImageColorsRaw("./test/test.jpg");
	t.is(colors1, colors2);

	let results = await Promise.all([colors1, colors2]);
	t.is(results[0], results[1]);
});

test("Memoization", async t => {
	let colors1 = getImageColors("./test/test.jpg");
	let colors2 = getImageColors("./test/test.jpg");
	t.is(colors1, colors2);

	let results = await Promise.all([colors1, colors2]);
	t.is(results[0], results[1]);
});
