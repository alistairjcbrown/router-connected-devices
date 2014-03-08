"use strict";

var gulp = require("gulp"),
    jshint = require("gulp-jshint");

gulp.task("lint", function() {
    gulp.src(["./**/*.js", "!./**/node_modules/**"])
        .pipe(jshint())
        .pipe(jshint.reporter("jshint-stylish"));
});
