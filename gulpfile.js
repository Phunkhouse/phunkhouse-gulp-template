const gulp = require("gulp")
const runSequence = require("run-sequence")


// Browser-sync
const browserSync = require("browser-sync").create()

gulp.task("browserSync", () => {

   browserSync.init({
      server: {
         baseDir: "dev"
      },
      loglevel: "debug"
   })

})


// Sass compiling
const sass = require("gulp-sass")

gulp.task("sass", () => {

   return gulp.src("dev/sass/**/*.+(scss|sass)")
      .pipe(sass())
      .pipe(gulp.dest("dev/css/"))
      // Enable Browser-sync
      .pipe(browserSync.reload({
         stream: true
      }))

})


// Optimize images
// Image caching
const cache = require("gulp-cache")

const imagemin = require("gulp-imagemin")
const imageminMozjpeg = require('imagemin-mozjpeg')

gulp.task("images", () => {
  
   return gulp.src("dev/**/*.+(png|jpg|gif|svg|webp)")
      .pipe(cache(imagemin(
         [imageminMozjpeg()],
         {verbose: true}
      )))
      .pipe(gulp.dest("dist/"))

})


// Fonts
gulp.task('fonts', () => {
   return gulp.src("dev/fonts/**/*")
      .pipe(gulp.dest("dist/fonts/"))
})


// Other files just for put through
gulp.task("others", () => {
   return gulp.src([
      "dev/*.+(xml|webmanifest|txt)",
      "dev/.htaccess"
   ])
      .pipe(gulp.dest("dist/"))
})


// Bundling CSS and JS files (minify, babel, autoprefixer)
const useref = require("gulp-useref")
const gulpIf = require("gulp-if")
const uglify = require("gulp-uglify")
const cleanCss = require("gulp-clean-css")
const autoprefixer = require("gulp-autoprefixer")
const babel = require("gulp-babel")
const htmlmin = require("gulp-htmlmin")
const lazyPipe = require("lazypipe")

gulp.task("useref", () => {

  return gulp.src("dev/*.html")
      .pipe(useref())
      .pipe(gulpIf("*.js", lazyPipe().pipe(babel, {presets: ["env"]}).pipe(uglify)()))
      .pipe(gulpIf("*.css", lazyPipe().pipe(autoprefixer).pipe(cleanCss)()))
      .pipe(gulpIf("*.html", htmlmin({ collapseWhitespace: true, ignoreCustomComments: [/^!/], minifyJS: true })))
      .pipe(gulp.dest("dist/"))

})


// Delete [dist] before new build
const del = require("del")

gulp.task("clean:dist", () => {
   return del.sync("dist")
})


// ---------------------------

// Local dev server
gulp.task("watch", ["browserSync", "sass"], () => {
   gulp.watch("dev/sass/**/*.+(scss|sass)", ["sass"]);
   gulp.watch("dev/*.html", browserSync.reload);
   gulp.watch("dev/js/**/*.js", browserSync.reload);
});

gulp.task("default", (callback) => {
   runSequence(["sass", "browserSync", "watch"], callback)
})


// Build script
gulp.task("build", (callback) => {
   runSequence("clean:dist", ["sass", "useref", "images", "fonts", "others"], callback)
})


// Clear cache
gulp.task("clear:cache", (callback) => {
   return cache.clearAll(callback)
})