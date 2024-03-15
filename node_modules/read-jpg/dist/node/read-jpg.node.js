const jpeg = require("jpeg-js");
const toab = require("toab");

module.exports = async function readJPG ({ data, debug }) {

  // convert data to an array buffer
  data = await toab(data);

  const decoded = jpeg.decode(data, { useTArray: true });
  if (debug) console.log("[read-jpg] decoded:", decoded);
  const result = {
    height: decoded.height,
    pixels: decoded.data,
    width: decoded.width
  };
  return result;
};
