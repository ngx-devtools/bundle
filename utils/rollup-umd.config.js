const config = require('./bundle-config');
const utils = require('./bundle-utils');

module.exports = {
  input: `${config.folder.tmp}/esm5/${config.rollup.entry}`,
  output: {
    format: 'umd',
    name: config.rollup.moduleName,
    exports: 'named',
    globals: config.rollup.globals,
    external: config.rollup.external
  },
  allowRealFiles: true,
  plugins: utils.plugins,
  onwarn: utils.onwarn
};