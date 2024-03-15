const readInNodeJS = require("./read-jpg.node.js");
const readInBrowser = require("./read-jpg.browser.js");

module.exports = input => {
  if (typeof window !== 'undefined') {
    return readInBrowser(input);
  } else if (typeof Buffer !== 'undefined') {
    return readInNodeJS(input);
  }
};
