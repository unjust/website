'use strict';

import gulp from 'gulp';
import sass from 'gulp-sass';
import pug from 'gulp-pug';
import header from 'gulp-header';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import pkg from './package.json';
import browserSync from 'browser-sync'
import copy from 'copy';
import { exec } from 'child_process';

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

// Copy third party libraries from /node_modules into /vendor
// TODO replace with browserfy or webpack
gulp.task('vendor', function() {

  // Bootstrap
  gulp.src([
      './node_modules/bootstrap/dist/**/*',
      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest(`${DIST}/vendor/bootstrap`))

  // Font Awesome
  // gulp.src([
  //     './node_modules/font-awesome/**/*',
  //     '!./node_modules/font-awesome/{less,less/*}',
  //     '!./node_modules/font-awesome/{scss,scss/*}',
  //     '!./node_modules/font-awesome/.*',
  //     '!./node_modules/font-awesome/*.{txt,json,md}'
  //   ])
  //   .pipe(gulp.dest('./vendor/font-awesome'))

  // jQuery
  gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest(`${DIST}/vendor/jquery`))

  // jQuery Easing
  gulp.src([
      './node_modules/jquery.easing/*.js'
    ])
    .pipe(gulp.dest(`${DIST}/vendor/jquery-easing`))

  // Magnific Popup
  gulp.src([
      './node_modules/magnific-popup/dist/*'
    ])
    .pipe(gulp.dest(`${DIST}/vendor/magnific-popup`))

});

// Compile SCSS
gulp.task('css:compile', function() {
  return gulp.src(`${APP}/scss/**/*.scss`)
    .pipe(sass.sync({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gulp.dest(`${APP}/css`))
});

// Minify CSS
gulp.task('css:minify', ['css:compile'], function() {
  return gulp.src([
      `${APP}/css/*.css`,
      `!${APP}/css/*.min.css`
    ])
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(`${DIST}/css`))
    .pipe(browserSync.stream());
});

// CSS
gulp.task('css', ['css:compile', 'css:minify']);

// Minify JavaScript
gulp.task('js:minify', function() {
  return gulp.src([
      `${APP}/js/*.js`,
      `!${APP}/js/*.min.js`
    ])
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(`${DIST}/js`))
    .pipe(browserSync.stream());
});

// JS
gulp.task('js', ['js:minify']);

// Default task
gulp.task('default', ['css', 'js', 'vendor']);

// Configure the browserSync task
gulp.task('browser-sync', ['server'], function() {
  browserSync.init(null, {
    proxy: "localhost:3000",
    // files: [`${APP}/**/*.*`],
    port: 7000
  });
});

// Provide `once: true` to restrict reloading to once per stream
gulp.task('templates', function () {
  return gulp.src([ `${APP}/**/views/*` ])
    .pipe(pug())
    .pipe(gulp.dest(DIST))
    .pipe(browserSync.stream({once: true}));
});


gulp.task('server', function(browserSyncCallback) {
  exec('node ./bin/www', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
  browserSyncCallback();
});

gulp.task('reload', function() {
  browserSync.reload();
});

// Dev task
gulp.task('dev', ['css', 'js', 'templates', 'browser-sync'], function() {
  console.log('set up watch');
  gulp.watch(`${APP}/**/views/*.pug`, ['templates', 'reload']);
  gulp.watch(`${APP}/scss/**/*.scss`, ['css', 'reload']);
  gulp.watch(`${APP}/js/**/*.js`, ['js', 'reload']);
});


