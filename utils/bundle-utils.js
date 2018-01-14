const path = require('path');
const glob = require('glob-all');

const tsConfigEs5 = require('./tsconfig-es5');
const plugins = [];

glob.sync([ 
  path.join(__dirname, '*-plugin.js'), 
  path.join(process.env.APP_ROOT_PATH, 'plugins', '*-plugin.js') 
])
.forEach(file => plugins.push(require(file)));

module.exports = {
  onwarn: (warning) => {
    if (warning.code === 'THIS_IS_UNDEFINED') { return; }
    console.log("Rollup warning: ", warning.message);
  },
  entry: tsConfigEs5.angularCompilerOptions.flatModuleOutFile,
  moduleId: tsConfigEs5.angularCompilerOptions.flatModuleId,
  plugins: plugins
};