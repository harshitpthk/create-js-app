var esm = require('esm');

require = esm(module /*, options*/);
var cli = require('./cli');

cli.run(process.argv);
