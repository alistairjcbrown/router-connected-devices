"use strict";

var gulp = require("gulp"),
    jshint = require("gulp-jshint"),
    jsValidate = require("gulp-jsvalidate");

gulp.task("lint", function() {
    gulp.src(["./**/*.js", "!./**/node_modules/**"])
        .pipe(jshint())
        .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("validate", function() {
    gulp.src(["./**/*.js", "!./**/node_modules/**"])
        .pipe(jsValidate());
});

gulp.task("default", ["lint", "validate"]);
