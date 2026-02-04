const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('!Stella2019', 10);
const fs = require('fs');
fs.writeFileSync('hash_output.txt', hash);
console.log('Done');
