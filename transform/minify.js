const { Transform } = require('stream');
const uglify = require('uglify-js');

const minify = () => {
  const transformStream = new Transform({
    objectMode: true,
    transform(file, enc, done){
      file.contents = Buffer.from(uglify.minify(file.contents.toString('utf8')).code, 'utf8');
      done(null, file);
    }
  });
  return transformStream;
};

module.exports = minify;