const vfs = require('vinyl-fs');

const base64 = require('gulp-base64-inline');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');

const streamToPromise = require('sprom');
const rimraf = require('rimraf');
const through2 = require('through2');
const uglify = require('uglify-js');
const glob = require('glob');

if (!(process.env.APP_ROOT_PATH)) new Error(`Please provide APP_ROOT_PATH.`); 

const ng2InlineTemplate = require('./utils/ng2-inline-template').ng2InlineTemplate;
const ngc = require('@angular/compiler-cli/src/main').main;

const { writeFileSync, readFileSync } = require('fs');
const { join, basename, dirname  } = require('path');

const utils = require('./utils/bundle-utils');

const config = require('./utils/bundle-config');
config.src = [ "src/**/*.ts", "!src/**/*.spec.ts", join(__dirname, 'utils', 'tsconfig-es5.js') ];

const umdConfig = require('./utils/rollup-umd.config');
const fesmConfig = require('./utils/rollup-fesm.config');

const minifyJS = () => {
  return through2.obj(function(file, enc, done) {
    const uglifyJS = uglify.minify(file.contents.toString('utf8')).code;
    file.contents = Buffer.from(uglifyJS, 'utf8');
    done(null, file);
  });
};

const rollupBuild = async (fileType) => {
  await streamToPromise.end(vfs.src(`${config.folder.tmp}/${fileType}/*.js`)
    .pipe(rollup(fesmConfig(fileType)))
    .pipe(vfs.dest(`${config.folder.dest}/${fileType}`))
  );
};

const rollupBuildUmd = async () => {
  await streamToPromise.end(vfs.src(`${config.folder.tmp}/esm5/*.js`)
    .pipe(rollup(umdConfig))
    .pipe(rename(config.rollup.umdName))
    .pipe(vfs.dest(config.folder.bundleDest))
    .pipe(minifyJS())
    .pipe(rename(`${config.rollup.moduleName}.umd.min.js`))
    .pipe(vfs.dest(config.folder.bundleDest))
  )
};

const createTsConfig = () => {
  const writeTSConfig = async (tsConfigFile, fileType, callback) => {
    const tsConfig = require(tsConfigFile);
    switch(fileType) {
      case 'esm2015': 
        tsConfig.compilerOptions.target = "es2015";
        tsConfig.compilerOptions.outDir = "./esm2015";
        break;
    }
    const dest = join(process.env.APP_ROOT_PATH, config.folder.tmp, `tsconfig-${fileType}.json`);
    await writeFileSync(dest, JSON.stringify(tsConfig, null, '\t'));
  };
  return through2.obj(function(file, enc, done) {
    if (basename(file.path) === 'tsconfig-es5.js'){
      (async () => await Promise.all([ await writeTSConfig(file.path, 'esm5'), await writeTSConfig(file.path, 'esm2015') ]) )();
    } else {
      this.push(file);
    }
    done();
  });
};

const copyFileEntry = async () => {
  const miscFiles = glob.sync(join(__dirname, 'misc', '*.ts'));
  await streamToPromise.end(vfs.src(miscFiles).pipe(vfs.dest(config.folder.tmp)));
};

const copyfile = async () => {
  await streamToPromise.end(vfs.src(config.src)
    .pipe(ng2InlineTemplate())
    .pipe(base64())
    .pipe(createTsConfig())
    .pipe(vfs.dest(config.folder.tmpDest))
  ).then(() => copyFileEntry());
};

const ngCompile = async () => {
  await Promise.all([
    ngc([ '--project', `${config.folder.tmp}/tsconfig-esm5.json` ]),
    ngc([ '--project', `${config.folder.tmp}/tsconfig-esm2015.json` ])
  ]);
};

const copyAssets = async () => {
  const copyAssets = [ 
    `${config.folder.tmp}/esm2015/**/*.d.ts`,
    `${config.folder.tmp}/esm2015/*.json`,
    'README.md', 
    'package.json'
  ];
  await streamToPromise.end(vfs.src(copyAssets).pipe(vfs.dest(config.folder.dest)));
};

exports.copyfile = async () => await copyfile();
exports.ngCompile = async () => await ngCompile();
exports.copyAssets = async () => await copyAssets();
exports.rollupBuild = async (type) => (type) ? await rollupBuild(type) : await rollupBuildUmd();
exports.bundle = async () => {
  await copyfile();
  await ngCompile();
  await Promise.all([ await rollupBuild('esm5'), await rollupBuild('esm2015'), await rollupBuildUmd(), await copyAssets() ])
};
exports.minify = async () => {
  await streamToPromise.end(vfs.src(`${config.folder.bundleDest}/*.js`)
    .pipe(minifyJS())
    .pipe(rename(`${config.rollup.moduleName}.umd.min.js`))
    .pipe(vfs.dest(config.folder.bundleDest))
  );
};
exports.rimraf = async (folderName) => {
  const directory = join(process.env.APP_ROOT_PATH, folderName);
  await new Promise((resolve, reject) => {
    rimraf(directory, (error) => (error) ? reject() : resolve());
  });
};