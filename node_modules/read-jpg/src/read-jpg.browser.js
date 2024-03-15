// insert readPixels here

async function readJPG ({ data, debug=false }) {
  if (debug) console.log("[read-jpeg] starting with", { data, debug });
  const result = await readPixels({ data, debug });
  if (debug) console.log("[read-jpeg] finishing with", { data, debug });
  return result;
};

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = readJPG;
}
if (typeof window !== 'undefined') window.readJPG = readJPG;
if (typeof self !== 'undefined') self.readJPG = readJPG;
