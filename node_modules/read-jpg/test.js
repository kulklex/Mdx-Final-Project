const { readFileSync } = require("fs");
const test = require("ava");
const toab = require("toab");
const readJPG = require("./src/read-jpg.node.js");

test("reading buffer", async t => {
  const buffer = readFileSync("./test/flower.jpg");
  const result = await readJPG({
    data: buffer,
    debug: false
  });
  t.is(result.height, 10);
  t.is(result.width, 10);
  t.is(result.pixels.length, 400);
});

test("reading array buffer", async t => {
  const buffer = readFileSync("./test/flower.jpg");
  const arrayBuffer = await toab(buffer);
  const result = await readJPG({
    data: arrayBuffer,
    debug: false
  });
  t.is(result.height, 10);
  t.is(result.width, 10);
  t.is(result.pixels.length, 400);
});

test("reading data url", async t => {
  const base64 = readFileSync("./test/flower.jpg", 'base64');
  const dataurl = "data:image/jpg;base64," + base64;
  const result = await readJPG({
    data: dataurl,
    debug: false
  });
  t.is(result.height, 10);
  t.is(result.width, 10);
  t.is(result.pixels.length, 400);
});

test("reading promised buffer", async t => {
  const buffer = readFileSync("./test/flower.jpg");
  const result = await readJPG({
    data: Promise.resolve(buffer),
    debug: false
  });
  t.is(result.height, 10);
  t.is(result.width, 10);
  t.is(result.pixels.length, 400);
});