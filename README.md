# ngx-bundle
A library that bundles your angular code, and publish as your library

### Getting Started
<br />

#### Requirements
+ Nodejs version 7+
+ Git Bash
<br />

##### Install
```
npm install --save-dev ngx-bundle
```  

##### Steps
+ All your code should be in `src` folder
+ You should have `index.ts` at root level of your `src` folder
+ `index.ts` file should have all exported component, modules, directives, pipes and etc. 

##### Bundle your code
```javascript
const gulp = require('gulp');
const ngxBundle = require('ngx-bundle');

gulp.task('bundle', async (done) => {
  await Promise.all([ await ngxBundle.rimraf('.tmp'), await ngxBundle.rimraf('dist') ])
    .then(() => ngxBundle.bundle())
    .then(() => ngxBundle.rimraf('.tmp'));
});
```

##### Example code
+ Please see my example code on angular elements on how to use `ngx-bundle` <br />
[Profile Card Angular Elements](https://github.com/aelbore/profile-card)

