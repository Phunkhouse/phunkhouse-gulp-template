const gulp = require('gulp')
const { series, parallel } = require('gulp')


// BROWSERSYNC LIVE SERVER
const browserSync = require('browser-sync').create()

const reload = done => {
   browserSync.reload();
   done();
}

const liveServer = done => {
   browserSync.init({
      server: {
         baseDir: 'dev'
      },
      loglevel: 'debug'
   });
   done();
}


// CLEAN DIST FOLDER
const clean = require('gulp-clean')

const cleanDist = () => {
   return gulp
      .src('dist/*', { 
         read: false
      })
      .pipe(clean())
}


// COMPILE SASS
const sass = require('gulp-sass')

const compileSass = () => {
   return gulp
      .src('dev/sass/*.+(scss|sass)')
      .pipe(sass())
      .pipe(gulp.dest('dev/css/'))
      .pipe(browserSync.reload({
         stream: true
      }))
}


// COMPRESS IMAGES AND CACHE THEM
const cache = require("gulp-cache")
const imagemin = require("gulp-imagemin")
const imageminMozjpeg = require('imagemin-mozjpeg')

const images = () => {
   return gulp
      .src("dev/**/*.+(png|jpg|gif|svg|webp)")
      .pipe(cache(imagemin(
         [
            imagemin.gifsicle({ interlaced: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
               plugins: [{
                  removeViewBox: false,
                  collapseGroups: true
               }]
            }),
            imageminMozjpeg({ progressive: true })
         ],
         { verbose: true }
      )))
      .pipe(gulp.dest("dist/"));
}


// PUSH FONTS THROUGH
const fonts = () => {
   return gulp
      .src('dev/fonts/**/*')
      .pipe(gulp.dest('dist/fonts/'))
}


// PUSH OTHER FILES THROUGH
const otherFiles = () => {
   return gulp
      .src(
         'dev/*.+(xml|webmanifest|txt)',
         'dev/.htaccess'
      )
}


// BUNDLE, MINIMALIZE, USE BABEL, USE AUTOPREFIXER AND CLEAN HTML
const useref = require('gulp-useref')
const lazyPipe = require('lazypipe')
const gulpIf = require('gulp-if')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const cleanCSS = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const htmlMin = require("gulp-htmlmin")

const bundleAndProcess = () => {
   return gulp
      .src('dev/*.html')
      .pipe(useref())
      .pipe(gulpIf("*.js", 
         lazyPipe()
            .pipe(babel, { 
               presets: ['@babel/env']
            })
            .pipe(uglify)
         ()
      ))
      .pipe(gulpIf('*.css', 
         lazyPipe()
            .pipe(autoprefixer)
            .pipe(cleanCSS)
         ()
      ))
      .pipe(gulpIf('*.html', 
         htmlMin({ 
            collapseWhitespace: true,
            ignoreCustomComments: [/^!/], 
            minifyJS: true 
         })
      ))
      .pipe(gulp.dest('dist/'))
}


// GULP BUILD TO DIST FOLDER
exports.build = series(cleanDist, compileSass, parallel(bundleAndProcess, images, fonts, otherFiles))


// GULP WATCH DEV FOLDER WITH LIVE SERVER
const watch = () => {
   gulp.watch('dev/sass/**/*.+(scss|sass)', gulp.series(compileSass, reload));
   gulp.watch('dev/js/**/*.js', reload);
   gulp.watch('dev/*.html', reload);
}
exports.default = series(compileSass, liveServer, watch)


// CLEAR CACHE
const clearCache = (callback) => {
   return cache.clearAll(callback)
}
exports.cache = clearCache