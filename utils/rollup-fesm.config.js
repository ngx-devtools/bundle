const config = require('./bundle-config');
const utils = require('./bundle-utils');

module.exports = folder => {
  return {
    input: `${config.folder.tmp}/${folder}/${config.rollup.entry}`,
    output: {
      format: 'es',
      external: config.rollup.external
    },
    allowRealFiles: true,
    plugins: utils.plugins,
    onwarn: utils.onwarn
  }
}