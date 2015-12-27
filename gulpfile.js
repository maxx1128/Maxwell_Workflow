var gulp = require('gulp');  
var p = require('gulp-load-plugins')(),
    nunjucksRender = require('gulp-nunjucks-render');

var browserSync = require('browser-sync'),
    fs = require('fs'),
    del = require('del'),
    runSequence = require('run-sequence');

// Important variables used throughout the gulp file //

// Configurations for different file paths
var config = {
    projectPath: 'app/',
    pAssetsPath: 'app/assets/',
    distPath: 'dist/',
    dAssetsPath: 'dist/assets/',
    componentPath: 'components/'
}

// Set to true if in production. Files will go to the 'app' folder.
// Set to false if launching. Files will go to the 'dist' folder, clean and ready
var prod = true;

// Find errors!
function errorLog(error) {
  console.error.bind(error);
  this.emit('end');
}

// Function for plumber to handle errors
function customPlumber(errTitle) {
    return p.plumber({
        errorHandler: p.notify.onError({
            // Custom error titles go here
            title: errTitle || 'Error running Gulp',
            message: "<%= error.message %>",
            sound: 'Submarine',
        })
    });
}

// Browser Sync settings and config
var bs_reload = {
    stream: true
};

gulp.task('browserSync', function() {
    var appSettings = {
        server: { baseDir: 'app' },
        reload: ({ stream: true}),
        notify: false
    };

    var distSettings = { 
        server: { baseDir: 'dist' },
        reload: ({ stream: true }),
        notify: false,
    };

    if (prod == true) { browserSync(appSettings) } 
    else { browserSync(distSettings) }
});

// Task to clean out files to be replaced on tasks
gulp.task('clean:dev', function(cb){
    del(prod ? ['app', 'img/sprites.png'] : ['dist', 'img/sprites.png'], cb)
});

// Merge the JSON files!
gulp.task('json:merge', function(){
    gulp.src('./data/partials/**/*.json')
        .pipe(p.extend('data.json'))
        .pipe(gulp.dest('./data'))
});

// Watch the homepage!
gulp.task('homepage', function(){
    gulp.src('index.html')
    .pipe(browserSync.reload(bs_reload))
});


// Gulp Tasks for basic automation below //

// Concats and minifies the JS files
gulp.task('scripts', function(){
    gulp.src('js/main.js')
    .pipe(customPlumber('Error running Scripts'))
    .pipe(p.if(prod, p.sourcemaps.init()))
    .pipe(p.include())
    .pipe(p.if(prod, p.sourcemaps.write()))
    .pipe(p.rename('main.min.js'))
    .pipe(p.if(prod, gulp.dest(config.pAssetsPath + 'js'), gulp.dest(config.dAssetsPath + 'js')))
    .pipe(p.notify({ message: 'JS Uglified!', onLast: true }))
    .pipe(browserSync.reload(bs_reload))
});

// Converts the Sass partials into a single CSS file
gulp.task('sass', function () {
    
    // Sass and styling variables
    var sassInput = 'sass/main.scss';
    var sassOptions = { 
        outputStyle: 'expanded',
        includePaths: ['components/']
    };

    // Sass variables for the dist folder
    var sassDistOptions = { 
        outputStyle: 'compressed' 
    };

    var autoprefixerOptions = {
      browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    };

  return gulp
    .src(sassInput)
    .pipe(customPlumber('Error running Sass'))
    // If in prod, will add sourcemaps to Sass
    .pipe(p.if(prod, p.sourcemaps.init()))
    // Write Sass for either dev or prod
    .pipe(p.if(prod, p.sass(sassOptions), p.sass(sassDistOptions)))
    .pipe(p.if(!prod, p.autoprefixer(autoprefixerOptions)))
    .pipe(p.if(prod, p.sourcemaps.write()))
    .pipe(p.rename("style.min.css"))
    // Sends the Sass file to either the app or dist folder
    .pipe(p.if(prod, gulp.dest(config.pAssetsPath + 'css'), gulp.dest(config.dAssetsPath + 'css')))
    .pipe(p.notify({ message: 'Sass Processed!', onLast: true }))
    .pipe(browserSync.reload(bs_reload))
});

// Creates a map of image sprites
gulp.task('sprites', function () {
    if (prod === true) { var imgPath = config.pAssetsPath + 'img'; }
    else { var imgPath = config.dAssetsPath + 'img'; }

    gulp.src('img/**/*')
    .pipe(p.spritesmith({
        cssName: '_sprites.scss', // CSS file 
        imgName: 'sprites.png',
        imgPath: '../img/sprites.png' // Image file
    }))
    .pipe(p.if('*.png', gulp.dest(imgPath)))
    .pipe(p.if('*.scss', gulp.dest('sass/components')))
});

// Converts Nunjucks templates and pages into HTML files
// Always runs the JSON merge task first for changes in data
gulp.task('nunjucks', ['json:merge'], function() {
    nunjucksRender.nunjucks.configure(['templates/'], {watch: false});

    // Gets .html and .nunjucks files in pages
    return gulp.src('pages/**/*.+(html|nunjucks)')
        .pipe(customPlumber('Error running Nunjucks'))
        .pipe(p.data(function() {
            return JSON.parse(fs.readFileSync('./data/data.json'))
        }))
        .pipe(nunjucksRender())
        .pipe(p.if(prod, gulp.dest(config.projectPath), gulp.dest(config.distPath)))
        .pipe(p.notify({ message: 'HTML Nunjucked!', onLast: true }))
        .pipe(browserSync.reload(bs_reload))
});





// Linting tasks below for checking the SCSS and JS files //

gulp.task('lint:sass', function() {
    return gulp.src('sass/**/*.scss')
        .pipe(p.scssLint({
            config: '.scss-lint.yml'
        }))
        .pipe(p.notify({ message: 'Sass Linted!', onLast: true }))
});

gulp.task('lint:js', function () {
  return gulp.src('js/**/*.js')
  .pipe(customPlumber('JSHint Error'))
  .pipe(p.jshint())
  .pipe(p.jshint.reporter('jshint-stylish'))
  .pipe(p.jshint.reporter('fail', {
    ignoreWarning: true,
    ignoreInfo: true
  }))
  .pipe(p.jscs({
    fix: true,
    configPath: '.jscsrc'
  }))
  .pipe(gulp.dest('js'))
  .pipe(p.notify({ message: 'JS Linted!', onLast: true }))
});

// Task to watch the things!
gulp.task('watch', function(){
    gulp.watch('js/**/**/*.js', ['scripts']);
    gulp.watch('sass/**/**/*.scss', ['sass']);
    gulp.watch(['pages/**/*.+(html|nunjucks)', 'templates/**/**/*.+(html|nunjucks)', 'data/**/**/*.json'], ['nunjucks']);
    gulp.watch(['img/**/**/*',], ['images']);
    gulp.watch('index.html', ['homepage']);
});



// Tasks that run multiple other tasks, including default //

gulp.task('default', function(callback) {
  runSequence(
    'clean:dev',
    'sprites',
    ['scripts', 'sass', 'nunjucks'], 
    ['browserSync', 'watch'],
    callback
  )
});

gulp.task('lint', ['lint:js', 'lint:sass']);