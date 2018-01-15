const { sync } = require('glob-all');
const { join } = require('path');

const pkg = require(join(process.env.APP_ROOT_PATH, 'package.json'));
const names = pkg.name.split('/');
const pkgName = (names.length < 2) ? pkg.name : names[1];

const plugins = sync([ 
  join(__dirname, '*-plugin.js'), 
  join(process.env.APP_ROOT_PATH, 'plugins', '*-plugin.js') 
]).map(file => require(file));

module.exports = {
  onwarn: (warning) => {
    if (warning.code === 'THIS_IS_UNDEFINED') { return; }
    console.log("Rollup warning: ", warning.message);
  },
  entry: `${pkgName}.js`,
  moduleId: pkgName,
  plugins: plugins
};