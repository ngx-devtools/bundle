const { Transform } = require('stream');
const { extname } = require('path');

const tsconfig = (rollup) => {
  const transformStream = new Transform({
    objectMode: true,
    transform (file, enc, done){
      if (extname(file.path) === '.json') {
        const contents = file.contents.toString('utf8').replace('package-name-js', rollup.moduleName).replace('package-name', rollup.entry);
        file.contents = Buffer.from(contents, 'utf8');     
      }
      done(null, file);
    }
  });
  return transformStream;
};

module.exports = tsconfig;