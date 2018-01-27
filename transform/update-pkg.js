const { Transform } = require('stream');
const { basename } = require('path');

const { moduleId } = require('../utils/bundle-utils');

module.exports = () => new Transform({
  objectMode: true,
  transform (file, enc, done) {
    if (basename(file.path) === 'package.json') {
      const jsonContent = JSON.parse(file.contents.toString('utf8'));
      if (!(jsonContent.hasOwnProperty('typings'))) {
        jsonContent['typings'] = `./${moduleId}.d.ts`
        file.contents = Buffer.from(JSON.stringify(jsonContent, null, 2), 'utf8');
      }
    }
    done(null, file);
  }
});