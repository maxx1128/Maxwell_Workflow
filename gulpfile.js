var gulp = require('gulp');  
var p = require('gulp-load-plugins')();

var del = require('del'),
    browserSync = require('browser-sync');

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
        server: {
            baseDir: 'app'
        },
        reload: ({
            stream: true
        }),
        
        notify: false,
    };

    var distSettings = {
        server: {
            baseDir: 'dist'
        },
        reload: ({
            stream: true
        }),
        
        notify: false,
    };

    if (prod == true) {
        browserSync(appSettings)
    } else {
        browserSync(distSettings)
    }
})

// Watch the homepage!
gulp.task('homepage', function(){
    gulp.src('index.html')
    .pipe(browserSync.reload(bs_reload))
});

// Uglify, to compress JS files
gulp.task('scripts', function(){
    gulp.src('js/main.js')
    .pipe(customPlumber('Error running Scripts'))
    .pipe(p.include())
    .pipe(p.rename('main.min.js'))
    .pipe(p.if(prod, gulp.dest(config.pAssetsPath + 'js'), gulp.dest(config.dAssetsPath + 'js')))
    .pipe(p.notify({
        message: 'JS Uglified!',
        onLast: true
    }))
    .pipe(browserSync.reload(bs_reload))
});

gulp.task('sass', function () {
    
    // Sass and styling variables
    var sassInput = 'sass/main.scss';
    var sassOptions = { 
        outputStyle: 'expanded' 
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
    .pipe(p.notify({
        message: 'Sass Processed!',
        onLast: true
    }))
    .pipe(browserSync.reload(bs_reload))
});

// Compress all the image things!
gulp.task('images', function () {
    return gulp.src('jade/img/*')
        .pipe(customPlumber('Error running Images'))
        .pipe(p.imagemin({
            progressive: true
        }))
        
        .pipe(p.if(prod, gulp.dest(config.pAssetsPath + '/img'), gulp.dest(config.dAssetsPath + '/img')))
        .pipe(p.notify({
            message: 'Images Optimized!',
            onLast: true
        }))
        .pipe(browserSync.reload(bs_reload))
});

// Get all the Jade things!
gulp.task('jade', function() {
    var my_locals = {};

    var appJadeSettings = {
        locals: my_locals,
        pretty: ' '
    };

    var distJadeSettings = {
        locals: my_locals
    };

    gulp.src('jade/**/**/*.jade')
        .pipe(p.if(prod, p.jade(appJadeSettings), p.jade(distJadeSettings)))
        .pipe(customPlumber('Error running Jade'))
        .pipe(p.if(prod, gulp.dest(config.projectPath), gulp.dest(config.distPath)))
        .pipe(p.notify({
            message: 'HTML Jaded!',
            onLast: true
        }))
        .pipe(browserSync.reload(bs_reload))
});


// How to make this a conditional in the Jade task???
gulp.task('clean', function () {
    return del([
        'build/extends'
    ]);
});


// Task to watch the things!
gulp.task('watch', function(){
    gulp.watch('js/**/**/*.js', ['scripts']);
    gulp.watch('sass/**/**/*.scss', ['sass']);
    gulp.watch('jade/**/**/*.jade', ['jade']);
    gulp.watch('jade/img/**/**/*', ['images']);
    gulp.watch('index.html', ['homepage']);
});

gulp.task('default', ['browserSync', 'scripts', 'sass', 'jade', 'images', 'watch']);