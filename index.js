const vfs = require('vinyl-fs');

const base64 = require('gulp-base64-inline');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');

const streamToPromise = require('sprom');
const rimraf = require('rimraf');
const through2 = require('through2');
const uglify = require('uglify-js');

if (!(process.env.APP_ROOT_PATH)) new Error(`Please provide APP_ROOT_PATH.`); 

const ng2InlineTemplate = require('./utils/ng2-inline-template').ng2InlineTemplate;
const ngc = require('@angular/compiler-cli/src/main').main;

const { writeFileSync } = require('fs');
const { join, basename  } = require('path');

const utils = require('./utils/bundle-utils');

const config = require('./utils/bundle-config');
config.src = [ "src/**/*.ts", "!src/**/*.spec.ts", join(__dirname, 'utils', 'tsconfig-es5.js') ];

const umdConfig = require('./utils/rollup-umd.config');
const fesmConfig = require('./utils/rollup-fesm.config');

const minify = () => {
  return through2.obj((file, enc, done) => {
    writeFileSync(file.path.replace('js', 'min.js'), uglify.minify(file.path).code);
    done();
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
    .pipe(minify())
  );
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

const writeFileEntryPoint = async () => {
  const ngEntryPointPath = filePath => join(process.env.APP_ROOT_PATH, config.folder.tmp, filePath);
  await Promise.all([
    writeFileSync(ngEntryPointPath('index.ts'), `export * from './public_api'`),
    writeFileSync(ngEntryPointPath('public_api.ts'), `export * from './src/index'`)
  ]);
};

const copyfile = async () => {
  await streamToPromise.end(vfs.src(config.src)
    .pipe(ng2InlineTemplate())
    .pipe(base64())
    .pipe(createTsConfig())
    .pipe(vfs.dest(config.folder.tmpDest))
  ).then(() => writeFileEntryPoint());
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
exports.rimraf = async (folderName) => {
  const directory = join(process.env.APP_ROOT_PATH, folderName);
  await new Promise((resolve, reject) => {
    rimraf(directory, (error) => (error) ? reject() : resolve());
  });
};