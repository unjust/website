'use strict';

import pkg from './package.json';

import gulp from 'gulp';
import nodemon from 'gulp-nodemon';

import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';

import browserify from 'browserify';
import babelify from 'babelify';
import uglify from 'gulp-uglify';

import sourcemaps from 'gulp-sourcemaps';

import source from 'vinyl-source-stream';
import buffer from "vinyl-buffer";
import promisedDel from 'promised-del';

import browserSync from 'browser-sync'
browserSync.create();

const DIST = './dist';
const APP = './app';

gulp.task('clean', function(done) {
  return promisedDel([`${DIST}/**/*`]);
});

// templates
gulp.task('templates', function() {
  console.log('copying templates');
  return gulp.src([ `${APP}/**/views/**/*` ])
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream({ once: true }));
});

// CSS

// css:vendor
gulp.task('css:vendor', function() { // TODO replace with browserfy or webpack ?
  return gulp.src([
      './node_modules/bootstrap/dist/css/**/*',
      './node_modules/magnific-popup/dist/*.css',
      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest(`${DIST}/css/vendor/`));
});

// compile:css
gulp.task('css:compile', function() {
  console.log('compiling css');
  return gulp.src(`${APP}/scss/**/*.scss`)
    .pipe(sass.sync({
      outputStyle: 'expanded'
    })
    .on('error', sass.logError))
    .pipe(gulp.dest(`${DIST}/css`))
});

// css:minify
gulp.task('css:minify', function() {
  console.log('minifying css');
  return gulp.src([
      `${DIST}/css/*.css`,
      `!${DIST}/css/*.min.css`
    ])
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(`${DIST}/css`))
    .pipe(browserSync.stream({ once: true }));
});

gulp.task('css', gulp.series('css:compile', 'css:minify', 'css:vendor'));

// JS
gulp.task('js', function() {
  return browserify({ 
      entries: [ `${APP}/js/freelancer.js` ], // TODO need to do this for all individual files? or do some globbing
      debug: true 
    })
  .transform(babelify)
  .bundle()
  .on('error', err => {
    console.log("Browserify Error", err.message);
  })
  .pipe(source(`freelancer.bundled.js`))
  .pipe(buffer())
  .pipe(sourcemaps.init())
  .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
      dirname: ''
    }))
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest(`${DIST}/js`))
  .pipe(browserSync.stream({ once: true }));
});

// img
gulp.task('img', function() {
  return gulp.src([ `${APP}/**/img/**` ])
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream({ once: true }));
});


gulp.task('build', gulp.series('img', 'templates', 'css', 'js'));

// server
gulp.task('start', function(cb) {
  let started = false;
  console.log('server init');
  nodemon({
    script: 'app.js'
  }).on('start', function() {
    if(!started) {
      cb();
    }
    started = true;
  })
});

gulp.task('watch', gulp.series('start', function() {
  console.log('watch init');
  browserSync.init({
    proxy: 'localhost:3000',
    port: 4000
  });
  gulp.watch(`${APP}/views/`, gulp.series('templates'), browserSync.reload);
  gulp.watch(`${APP}/**/scss/*.*`, gulp.series('css:compile', 'css:minify'), browserSync.reload);
  gulp.watch(`${APP}/**/js/*.*`, gulp.series('js'), browserSync.reload);
  gulp.watch(`${APP}/img/`, gulp.series('img'), browserSync.reload);
}));

gulp.task('default', gulp.series('clean', 'build'));
// gulp.task('start', gulp.series('build', 'server'));
// gulp.task('dev', gulp.series('build', 'browser-sync'));
gulp.task('dev', gulp.series('clean', 'build', 'watch'));



