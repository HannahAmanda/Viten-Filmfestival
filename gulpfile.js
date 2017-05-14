'use strict';

var autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create(),
    cleanCss = require('gulp-clean-css'),
    connect = require('gulp-connect'),
    concat = require('gulp-concat'),
    gulp = require('gulp'),
    include = require('gulp-include'),
    minify = require('gulp-minify'),
    sass = require('gulp-sass'),
    sassLint = require('gulp-sass-lint'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-minify'),
    ngHtml2Js = require("gulp-ng-html2js"),
    minifyHtml = require("gulp-minify-html");

var normalize = require('node-normalize-scss').includePaths;

var gulp = require('gulp');
var plumber = require('gulp-plumber');

// Include plugins
var plugins = require("gulp-load-plugins")({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

const autoPrefixerConfig = {
    browsers: [
        'last 3 versions'
    ]
};

const cleanCssConfig = {
    compatibility: 'ie9'
};

var public_folder = '';
var sass_folder = public_folder + 'sass/';
var js_folder = public_folder + 'js/';
var html_folder = 'views/';

var paths = {
    sass : {
        mainfile : [sass_folder + 'screen.scss'],
        rteFile : [sass_folder + 'rich-text-editor.scss'],
        src : sass_folder + '**/*.s+(a|c)ss',
        dest : public_folder + 'dist/css',
        extra : normalize
    },
    js : {
        filename : 'bundle.js',
        mainfile : js_folder + 'bundle.js',
        src : js_folder + '**/**/*.js',
        dest : public_folder + 'dist/js'
    },
    html : {
        src : html_folder + '**/*.html'
    }
};


// DEV
gulp.task('sass:rte', function(done) {
    // IMPORTANT: Do not minify this file! Comments are important for umbraco.
    return gulp.src(paths.sass.rteFile)
        .pipe(plumber())
        .pipe(plugins.filter('**/*.s+(a|c)ss'))
        .pipe(plugins.sass({
            includePaths: paths.sass.extra,
            outputStyle: 'expanded'
        }).on('error', plugins.sass.logError))
        .pipe(autoprefixer(autoPrefixerConfig))
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('sass:screen', function() {
    return gulp.src(paths.sass.mainfile)
        .pipe(plumber())
        .pipe(plugins.filter('**/*.s+(a|c)ss'))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass({
            includePaths: paths.sass.extra
        }))
        .pipe(autoprefixer(autoPrefixerConfig))
        .pipe(cleanCss(cleanCssConfig))
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('sass', gulp.parallel(['sass:screen' /*'sass:rte'*/]));

gulp.task('sass-lint', function () {
    return gulp.src(paths.sass.src)
        .pipe(plumber())
        .pipe(plugins.sassLint())
        .pipe(plugins.sassLint.format())
        .pipe(plugins.sassLint.failOnError());
});

gulp.task('bundle-js', function(done) {
    console.log("bundle-js");
    gulp.src(paths.js.src)
        .pipe(plumber())
        .pipe(plugins.filter('**/**/*.js'))
        .pipe(plugins.concat(paths.js.filename))
        .pipe(gulp.dest(paths.js.dest));
    done();
});

gulp.task('connect', function(done) {
    browserSync.init({
      server: {
        baseDir: public_folder
      },
      port: 8000,
      livereload: true,
      open: true
    });
    done();
});

// Manually reload browserSync
gulp.task('manual-reload', function () {
    browserSync.reload();
});

gulp.task('watch', function () {
    gulp.watch(paths.sass.src).on('change', gulp.series('sass', 'manual-reload'));
    gulp.watch(paths.js.src).on('change', gulp.series('bundle-js', 'manual-reload'));
    gulp.watch(paths.html.src).on('change', gulp.series('manual-reload'));
    gulp.watch(public_folder + 'src/js/**/**/*.html').on('change', gulp.series('bundle-angular-templates', 'bundle-js', 'manual-reload'));

});

// DIST
gulp.task('sass-dist', function(done) {
    gulp.src(paths.sass.mainfile)
        .pipe(plugins.filter('**/*.s+(a|c)ss'))
        .pipe(plugins.sass({
            includePaths: paths.sass.extra
        }).on('error', plugins.sass.logError))
        .pipe(autoprefixer)
        .pipe(cleanCss)
        .pipe(gulp.dest(paths.sass.dest));
    done();
});

gulp.task('js-dist', function(done) {
    gulp.src(paths.js.src)
        .pipe(plugins.filter('**/*.js'))
        .pipe(plugins.concat(paths.js.filename))
        .pipe(plugins.uglify())
        .pipe(gulp.dest(paths.js.dest));
    done();
});

gulp.task('bundle-angular-templates', function(done){
    gulp.src(public_folder + 'src/js/**/*.html')
        .pipe(minifyHtml({
            empty: true,
            spare: true,
            quotes: true
        }))
        .pipe(ngHtml2Js({
            moduleName: "AngularTemplates",
            prefix: "/angular-templates/"
        }))
        .pipe(concat("templates.js"))
        .pipe(gulp.dest(public_folder + 'src/js/angular-templates'));
    done();
});

gulp.task('dist', gulp.series('sass-lint', 'sass-dist', 'js-dist'));
gulp.task('build', gulp.series('sass', 'bundle-angular-templates', 'bundle-js'));
gulp.task('serve', gulp.series('sass', 'bundle-angular-templates', 'bundle-js', 'connect', 'watch'));
gulp.task('default', gulp.series('serve'));
