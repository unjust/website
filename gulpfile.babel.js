'use strict';

import pkg from './package.json';
import copy from 'copy';
import { exec } from 'child_process';

import source from 'vinyl-source-stream';
import buffer from "vinyl-buffer";

import browserify from 'browserify';
import browserifyCSS from 'browserify-css';
import babelify from 'babelify';

import gulp from 'gulp';
import clean from 'gulp-clean';
import pug from 'gulp-pug';
import sass from 'gulp-sass';

import header from 'gulp-header'; // TODO is this used?

import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import babel from 'gulp-babel';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';

import browserSync from 'browser-sync'
import promisedDel from 'promised-del';

// import watchify from 'watchify';

const DIST = './dist';
const APP = './app';

browserSync.create();

// Set the banner content
var banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  ''
].join('');

gulp.task('clean', function(done) {
  // return gulp.src(`${DIST}/**/*`, { read: false })
  //   .pipe(clean());
  return promisedDel([`${DIST}/**/*`]);
});

// CSS

// gulp.task('create_dir', function(done) {
//   return gulp.dest(`${DIST}/css/vendor/`);
// });

// TODO replace with browserfy or webpack
gulp.task('css:vendor', function() {
  // need to create dir first to avoid error
  return gulp.src([
      './node_modules/bootstrap/dist/css/**/*',
      './node_modules/magnific-popup/dist/*.css',
      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest(`${DIST}/css/vendor/`));

  // Not using Font Awesome at the moment
  // gulp.src([
  //     './node_modules/font-awesome/**/*',
  //     '!./node_modules/font-awesome/{less,less/*}',
  //     '!./node_modules/font-awesome/{scss,scss/*}',
  //     '!./node_modules/font-awesome/.*',
  //     '!./node_modules/font-awesome/*.{txt,json,md}'
  //   ])
  //   .pipe(gulp.dest('./vendor/font-awesome'))

  // Magnific Popup
  // return gulp.src([
  //     './node_modules/magnific-popup/dist/*.css'
  //   ])
  //   .pipe(gulp.dest(`${DIST}/css/vendor/magnific-popup`))

});

// Compile SCSS
gulp.task('css:compile', function() {
  return gulp.src(`${APP}/scss/**/*.scss`)
    .pipe(sass.sync({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gulp.dest(`${DIST}/css`))
});

// Minify CSS
gulp.task('css:minify', function() {
  return gulp.src([
      `${DIST}/css/*.css`,
      `!${DIST}/css/*.min.css`
    ])
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(`${DIST}/css`))
    .pipe(browserSync.stream());
});

// CSS
gulp.task('css', gulp.series('css:compile', 'css:minify', 'css:vendor'));

// JS

// js:bundle
// transforms es6 with babel,
// bundles node packages for import with browserify,
// creates sourcemaps
// minifies with uglify

gulp.task('js:process', function() {
  // TODO need to do this for all individual files? or do some globbing
  return browserify({ 
      entries: [ `${APP}/js/freelancer.js` ],
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
});

// js:min
// cobined with above task but could we split without 
// having to create a new bundled file?
// gulp.task('js:min', function() {
//   return gulp.src(`${APP}/js/freelancer.bundled.js`)
//     .pipe(sourcemaps.init())
//     .pipe(uglify())
//     .pipe(rename({
//       suffix: '.min',
//       dirname: ''
//     }))
//   .pipe(sourcemaps.write('./maps'))
//   .pipe(gulp.dest(`${DIST}/js`))
//   // .pipe(browserSync.stream({ once: true }));
// });

gulp.task('js', gulp.series('js:process'));

// templates
gulp.task('templates', function() {
  return gulp.src([ `${APP}/**/views/*` ])
    .pipe(pug())
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream({ once: true })); // Provide `once: true` to restrict reloading to once per stream
});

// img
gulp.task('img', function() {
  return gulp.src([ `${APP}/**/img/*` ])
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream({ once: true }));
});

gulp.task('build', gulp.series('css', 'js', 'img', 'templates'));
gulp.task('default', gulp.series('clean', 'build'));

// server
gulp.task('server', function(browserSyncCallback) {
  exec('node ./bin/www', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
  browserSyncCallback();
});

// Configure the browserSync task
// browser-sync
gulp.task('browser-sync', gulp.series('server', function() {
  return browserSync.init(null, {
    proxy: "localhost:3000",
    files: [`${APP}/**/*.*`],
    port: 7000
  });
}));

// reload
gulp.task('reload', function() {
  console.log('reloading');
  return browserSync.reload();
});

// default task

gulp.task('start', gulp.series('build', 'browser-sync'));
// dev task
gulp.task('dev', gulp.series('build', 'server', 'browser-sync', function() {
  console.log('set up watch');
  gulp.watch(`${APP}/**/views/*.pug`, ['templates', 'reload']);
  gulp.watch(`${APP}/scss/**/*.scss`, ['css', 'reload']);
  gulp.watch(`${APP}/js/**/*.js`, ['js', 'reload']);
}));


