var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var es = require('event-stream');
var inject = require('gulp-inject');
var series = require('stream-series');
var yaml = require('yamljs');
var copy = require('gulp-copy');
var ngConstant = require('gulp-ng-constant');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

config = yaml.load('./config.yml');

gulp.task('config', function(){
	/*return gulp.src('')
    .pipe(ngConstant({
    	name: 'pmAngular',
    	deps: [
			'oauth',
		    'oauth.directive',
		    'oauth.accessToken',
		    'oauth.endpoint',
		    'oauth.profile',
		    'oauth.interceptor',
		    'ngRoute',
		    'ui.bootstrap'
    	],
    	//wrap: 'commonjs',
      	constants: { baseUrl: config.baseUrl },
    }))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('src'));*/
});
gulp.task('templates', function(){
	return gulp.src('./src/views/**/*.html')
	.pipe(gulp.dest('./dist/views'));
});
gulp.task('build', ['config', 'templates'], function () {
	//Define the source file for the index.html
  	var indexFile = gulp.src('./src/index.html');
  	/*
  		<------ THIRD PARTY JAVASCRIPTS ------->
		Get all the third party npm modules and minify them into a single file
  	*/

	switch(config.env){
		case 'dev':
		case 'test':
			var thirdpartyStream = gulp.src([
	  		'./node_modules/angular/angular.js',
	  		'./node_modules/jquery/dist/jquery.js',
	  		'./node_modules/bootstrap/dist/js/bootstrap.js',
	  		'./node_modules/angular-route/angular-route.js',
	  		'./node_modules/angular-ui-router/release/angular-ui-router.js',
	  		'./node_modules/angular-bootstrap-npm/dist/angular-bootstrap.js'
	  		])
	  		.pipe(sourcemaps.init())
	  		.pipe(concat('thirdparty.js'))
	  		.pipe(sourcemaps.write())
			.pipe(gulp.dest('./dist'));
			/*
			<------ CUSTOM THIRD PARTY JAVASCRIPTS ------->
			Get all the third party modules that are not in npm and minify them into a single file
		  	*/
		  	var customThirdpartyStream = gulp.src([
		  		'./thirdparty/ace-extra.js',
		  		'./thirdparty/ace-elements.js',
		  		'./thirdparty/ace.js'
		  		])
		  		.pipe(sourcemaps.init())
				.pipe(concat('thirdparty_custom.js'))
				.pipe(sourcemaps.write())
				.pipe(gulp.dest('./dist'));

			/*
		  		<------ APPLICATION JAVASCRIPTS ------->
				Get all the applications javascripts and minify them into a single file
		  	*/

		  	var appStream = gulp.src([
		  		'./src/app.js',
		  		'./src/config/config.js',
		  		//'./src/services/*.js',
		  		'./src/services/ng-oauth.js',
		  		'./src/services/api.js',
		  		'./src/services/ngstorage.js',
		  		'./src/controllers/*.js'
		  		])
			  	.pipe(sourcemaps.init())
				.pipe(concat('app.js'))
			  	.pipe(sourcemaps.write())
				.pipe(gulp.dest('./dist'));

				/*
					<------ THIRD PARTY CSS ------->
					Get all the third party npm modules and minify them into a single file
				*/
			  var cssStream = gulp.src([
			  	'./node_modules/bootstrap/dist/css/bootstrap.css'
			  	])
			  	.pipe(sourcemaps.init())
			  	.pipe(concat('styles.css'))
			  	.pipe(sourcemaps.write())
		  		.pipe(gulp.dest('./dist'));
			  	/*
					<------ CUSTOM THIRD PARTY CSS ------->
					Get all the third party modules that are not in npm and minify them into a single file
				*/
			  var customCssStream = gulp.src([
			  	'./public/assets/styles/font-awesome.min.css',
			  	'./public/assets/styles/font-awesome-ie7.min.css',
			  	'./public/assets/styles/ace-fonts.css',
			  	'./public/assets/styles/ace.min.css',
			  	'./public/assets/styles/ace-responsive.min.css',
			  	'./public/assets/styles/ace-skins.min.css',
			  	'./public/assets/styles/ace-ie.min.css',
			  	])
			  	.pipe(sourcemaps.init())
			  	.pipe(concat('customStyles.css'))
		  		.pipe(sourcemaps.write())
		  		.pipe(gulp.dest('./dist'));
		  break;
		case 'prod':
		default:
			var thirdpartyStream = gulp.src([
	  		'./node_modules/angular/angular.min.js',
	  		'./node_modules/angular-route/angular-route.min.js',
	  		'./node_modules/angular-ui-router/release/angular-ui-router.min.js',
	  		'./node_modules/jquery/dist/jquery.min.js',
	  		'./node_modules/bootstrap/dist/js/bootstrap.min.js'
	  		])
	  		.pipe(sourcemaps.init())
	  		.pipe(concat('thirdparty.js'))
			.pipe(uglify())
		  	.pipe(sourcemaps.write())
			.pipe(gulp.dest('./dist'));

			/*
			<------ CUSTOM THIRD PARTY JAVASCRIPTS ------->
			Get all the third party modules that are not in npm and minify them into a single file
		  	*/
		  	var customThirdpartyStream = gulp.src([
		  		'./thirdparty/ace-extra.min.js',
		  		'./thirdparty/ace-elements.js',
		  		'./thirdparty/ace.js',
		  		])
				.pipe(concat('thirdparty_custom.js'))
				.pipe(uglify())
				.pipe(gulp.dest('./dist'));

			/*
		  		<------ APPLICATION JAVASCRIPTS ------->
				Get all the applications javascripts and minify them into a single file
	  		*/

		  	var appStream = gulp.src([
		  		'./src/services/*.js',
		  		'./src/app.js',
		  		'./src/config/*.js',
		  		'./src/controllers/*.js'
		  		])
			  	.pipe(sourcemaps.init())
				.pipe(concat('app.js'))
				.pipe(uglify())
			  	.pipe(sourcemaps.write())
				.pipe(gulp.dest('./dist'));

				/*
					<------ THIRD PARTY CSS ------->
					Get all the third party npm modules and minify them into a single file
				*/
			  var cssStream = gulp.src([
			  	'./node_modules/bootstrap/dist/css/bootstrap.min.css',
			  	]) 
			  	.pipe(sourcemaps.init())
			  	.pipe(uglify())
			  	.pipe(concat('styles.css'))
				.pipe(sourcemaps.write())
			  	.pipe(gulp.dest('./dist'));
			  	/*
					<------ CUSTOM THIRD PARTY CSS ------->
					Get all the third party modules that are not in npm and minify them into a single file
				*/
			  var customCssStream = gulp.src([
			  	'./public/assets/styles/font-awesome.min.css',
			  	'./public/assets/styles/font-awesome-ie7.min.css',
			  	'./public/assets/styles/ace-fonts.css',
			  	'./public/assets/styles/ace.min.css',
			  	'./public/assets/styles/ace-responsive.min.css',
			  	'./public/assets/styles/ace-skins.min.css',
			  	'./public/assets/styles/ace-ie.min.css',
			  	])
			  	.pipe(uglify())
				.pipe(sourcemaps.init())
				.pipe(concat('customStyles.css'))
			  	.pipe(sourcemaps.write())
				.pipe(gulp.dest('./dist'));
		break;
		}
	gulp.src('./public/assets/font/*')
	.pipe(copy('./dist/font', {prefix: 3}));

  return indexFile
  		.pipe(
  		inject(
  			series(
  				cssStream,
  				customCssStream,
  				thirdpartyStream,
  				customThirdpartyStream,
  				appStream
			),
			{relative: true})
		)
  		.pipe(gulp.dest('dist'));
});

gulp.task('scripts', function(){

    var controllers = gulp.src('src/controllers/*.js');

    return es.merge(javascriptFromCoffeeScript, js)
    .pipe(concat('all.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dest'));
});

gulp.task('watch', function(){
	gulp.watch('./src/**/*.{js,html}', ['build'])
    //gulp.watch('src/*.{js,coffee}', ['scripts']);
});