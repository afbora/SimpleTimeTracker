let gulp = require("gulp"),
  gutil = require("gulp-util"),
  coffee = require("gulp-coffee"),
  uglify = require('gulp-uglify'),
  less = require("gulp-less"),
  concat = require("gulp-concat"),
  zip = require("gulp-zip"),
  path = require("path");

// run task: gulp zip
gulp.task("zip", function () {
  return gulp
    .src(
      [
        'css/*',
        'js/*',
        'manifest.json',
        'options.html',
        'popup.html',
        'stt128x128.png',
        'stt32x32.png'
      ],
      {base: "."}
    )
    .pipe(zip('simple_time_tracker.zip'))
    .pipe(gulp.dest('dist'));
});
