# node-banusave
Node.js encoder and decoder for BanUSave, the save fie format used by iWillBanU's games.

## Usage

### Import the Library
```javascript
// CommonJS
const banusave = require("banusave");

// ESM
import banusave from "banusave";

// TypeScript
import * as banusave from "banusave";
```

### Encode JSON data
```javascript
const data = {
    name: "John Doe", 
    age: 42, 
    address: {
        street: "123 Main St", 
        city: "Anytown", 
        state: "CA"
    }
};

const encoded = banusave.encode(data, "gameID");
console.log(encoded);
// <Buffer 42 41 4e 55 53 41 56 45...>

// Write it to a file
fs.writeFileSync("save.bsve", encoded);
```

### Decode BanUSave data
```javascript
// Read the file data
const encoded = fs.readFileSync("save.bsve");

const decoded = banusave.decode(encoded);
console.log(decoded);
// [{name: "John Doe", age: 42...}, "gameID"]
```
---
Created by [iWillBanU](https://github.com/iWillBanU). Licensed under the [MIT license](LICENSE.md).
