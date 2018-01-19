
const vfs = require('vinyl-fs');

const base64 = require('gulp-base64-inline');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');

const streamToPromise = require('sprom');
const rimraf = require('rimraf');

const { join, resolve, extname } = require('path');
const { minify, tsconfig } = require('./transform');

if (!(process.env.APP_ROOT_PATH)) {
  process.env.APP_ROOT_PATH = resolve();
}

const ng2InlineTemplate = require('./utils/ng2-inline-template').ng2InlineTemplate;
const ngc = require('@angular/compiler-cli/src/main').main;

const config = require('./utils/bundle-config');

const umdConfig = require('./utils/rollup-umd.config');
const fesmConfig = require('./utils/rollup-fesm.config');

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
    .pipe(minify())
    .pipe(rename(`${config.rollup.moduleName}.umd.min.js`))
    .pipe(vfs.dest(config.folder.bundleDest))
  )
};

const copyFileEntry = async () => {
  await streamToPromise.end(vfs.src(join(__dirname, 'misc', '*.*'))
    .pipe(tsconfig(config.rollup))
    .pipe(vfs.dest(config.folder.tmp))
  );
};

const copyfile = async () => {
  await streamToPromise.end(vfs.src(config.src)
    .pipe(ng2InlineTemplate())
    .pipe(base64())
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
  await Promise.all([ await rollupBuild('esm5'), await rollupBuild('esm2015'), await rollupBuildUmd(), await copyAssets() ]);
};
exports.minify = async () => {
  await streamToPromise.end(vfs.src(`${config.folder.bundleDest}/*.js`)
    .pipe(minify())
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