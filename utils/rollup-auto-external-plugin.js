const { resolve, join, dirname } = require('path');
const { sync } = require('glob');

const appPath = (...paths) => join(process.env.APP_ROOT_PATH, ...paths);

const pkg = require(appPath('package.json'));

const globJsFiles = key => 
  sync(appPath('node_modules', key, '**/*.js'))
    .map(file => file.substr(file.match(key).index, file.length).replace('.js', ''));

const filterIdPredicate = (data, external) => 
  ((external.find(_ => _ === data ) === undefined) && data !== 'rxjs' && data !== 'zone.js');

const filterTypings = ids => ids.filter(id => 
  require(appPath('node_modules', id, 'package.json'))
    .hasOwnProperty('typings'));

module.exports = {
  name: "auto-external",
  options (opts) {
    const copyConfig = Object.assign({}, opts);

    let jsFiles = [];
    
    if (pkg['dependencies']) {
      const idKeys = Object.keys(pkg.dependencies);
      const idsCopy = idKeys.filter(data => filterIdPredicate(data, opts.external));
      if (idsCopy) {
        const typings = filterTypings(idsCopy);
        idsCopy.forEach(file => {
          if (typings.find(_ => _ === file)) {
            jsFiles.push(file);
          } else {
            jsFiles = jsFiles.concat(globJsFiles(file));
          }      
        });
      }
    }
    jsFiles = (jsFiles.length <= 0) ? require('./bundle-config').rollup.external : jsFiles;
    jsFiles.forEach(file => {
      if (!(copyConfig.external.find(value => value === file))) {
        copyConfig.external.push(file);
      }
    });
    return copyConfig;    
  }
};