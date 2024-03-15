# read-jpg
Universal JPG File Reader.  Uses read-pixels in the Browser and jpeg-js in NodeJS

# install
```bash
npm install read-jpg
```

# usage in the browser / frontend
```js
import readJPG from 'read-jpg';

const result = readJPG({ data: arrayBuffer });
// result is { height: 200, width: 100, pixels: [[[...]]] }
```

# usage in NodeJS / backend
```js
const readJPG = require("read-jpg");

const result = readJPG({ data: buffer });
```