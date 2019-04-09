const gulp           = require('gulp');
const ejs            = require('gulp-ejs');
const sass           = require('gulp-sass');
const uglify         = require('gulp-uglify');
const imagemin       = require('gulp-imagemin');
const mozjpeg        = require('imagemin-mozjpeg');
const pngquant       = require('imagemin-pngquant');
const postcss        = require('gulp-postcss');
const autoprefixer   = require('autoprefixer');
const browserSync    = require('browser-sync').create();
const notify         = require('gulp-notify');
const plumber        = require('gulp-plumber');
const rename         = require('gulp-rename');
const replace        = require('gulp-replace');
const del            = require('del');

const supportBrowser = ['last 3 versions', 'ie >= 8', 'Android >= 4', 'iOS >= 8'];

const paths = {
  root: {
    source: './source',
    dest: './public',
  },
  html: {
    source: './source/**/*.ejs',
    dest: './public/',
  },
  styles: {
    source: './source/assets/sass/**/*.scss',
    dest: './public/assets/css',
    map: './public/assets/css/maps',
  },
  scripts: {
    source: './source/assets/js/**/*.js',
    dest: './public/assets/js',
  },
  images: {
    source: './source/assets/images/**/*.{jpg,jpeg,png,svg,gif}',
    dest: './public/assets/images/',
  },
};

// EJSコンパイル
function html() {
  return gulp
    .src([paths.html.source,'!' + 'source/**/_*.ejs'])
    .pipe(
      plumber({
        errorHandler: notify.onError('<%= error.message %>'),
      }),
    )
    .pipe(ejs())
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest(paths.html.dest));
}

// Sassコンパイル(非圧縮)
function styles() {
  return gulp
    .src(paths.styles.source, { sourcemaps: true })
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(sass({outputStyle: 'expanded'}))
    .pipe(postcss([
      autoprefixer({
        browsers: supportBrowser,
        cascade: false
      })
    ]))
    .pipe(gulp.dest(paths.styles.dest, { sourcemaps: './maps' }));
}

// Sassコンパイル（圧縮）
function stylesCompress() {
  return gulp
    .src(paths.styles.source)
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(postcss([
      autoprefixer({
        browsers: supportBrowser,
        cascade: false
      })
    ]))
    .pipe(gulp.dest(paths.styles.dest));
}

// JSコンパイル
function scripts() {
  return gulp
    .src(paths.scripts.source)
    .pipe(plumber())
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
}

// 画像最適化
const imageminOption = [
  // pngquant({
  //   quality: [0.7, 0.85],
  // }),
  // mozjpeg({
  //   quality: 85,
  // }),
  imagemin.gifsicle(),
  imagemin.jpegtran(),
  imagemin.optipng(),
  imagemin.svgo({
    removeViewBox: false,
  }),
];

function images() {
  return gulp
    .src(paths.images.source, {
      since: gulp.lastRun(images),
    })
    .pipe(imagemin(imageminOption))
    .pipe(gulp.dest(paths.images.dest));
}

// Destファイル除去
function cleanDest() {
  return del([paths.root.dest]);
}

// ブラウザ更新&ウォッチタスク
const browserSyncOption = {
  port: 3000,
  server: {
    baseDir: './public/',
    index: 'index.html',
  },
  reloadOnRestart: true,
};

function browsersync(done) {
  browserSync.init(browserSyncOption);
  done();
}

function watchFiles(done) {
  const browserReload = () => {
    browserSync.reload();
    done();
  };
  gulp.watch(paths.styles.source).on('change', gulp.series(styles, browserReload));
  gulp.watch(paths.scripts.source).on('change', gulp.series(scripts, browserReload));
  gulp.watch(paths.html.source).on('change', gulp.series(html, browserReload));
  gulp.watch(paths.images.source).on('change', gulp.series(images, browserReload));
}

gulp.task('default', gulp.series(browsersync, watchFiles));

gulp.task('clean', cleanDest);
gulp.task('build', gulp.series('clean', gulp.parallel(html, styles, scripts, images)));
gulp.task('release', gulp.series('clean', gulp.parallel(html, stylesCompress, scripts, images)));
