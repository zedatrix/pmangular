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
var replace = require('gulp-replace');

config = yaml.load('./config.yml');
//console.log(config);
gulp.task('default', ['build', 'templates'], function(){

});
gulp.task('templates', function(){
	return gulp.src('./src/views/**/*.html')
		.pipe(replace('$$WelcomeMessage$$', config.WelcomeMessage))
	.pipe(gulp.dest('./dist/views'));
});
gulp.task('build', function () {
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
		  		'./src/config/routes.js',
		  		'./src/config/variables.js',
		  		//'./src/services/*.js',
		  		'./src/services/ng-oauth.js',
		  		'./src/services/api.js',
		  		'./src/services/ngstorage.js',
		  		'./src/controllers/*.js'
		  		])
			  	.pipe(sourcemaps.init())
				.pipe(concat('app.js'))
				.pipe(replace('$$ConfigObject$$', "{\n" +
				"\t\toauth_button : {\n"+
				"\t\t\ttext: '"+config.OauthButton.text+"',\n" +
				"\t\t\tscope: '"+config.OauthButton.scope+"',\n" +
				"\t\t\tsite: '"+config.OauthButton.site+"',\n" +
				"\t\t\tclientId: '"+config.OauthButton.clientId+"',\n" +
				"\t\t\tredirectUri: '"+config.OauthButton.redirectUri+"',\n" +
				"\t\t\tauthorizePath: '"+config.OauthButton.authorizePath+"',\n" +
				"\t\t\ttokenPath: '"+config.OauthButton.tokenPath+"'\n" +
				"\t\t}\n" +
				"\t}\n"))
				.pipe(replace('$$ApiUrl$$', config.ApiUrl))
				.pipe(replace('$$AppTitle$$', config.AppTitle))
				.pipe(replace('$$WelcomeMessage$$', config.WelcomeMessage))
				.pipe(replace('$$NoCasesMessage$$', config.NoCasesMessage))
				.pipe(replace('$$FormSubmittedMessage$$', config.FormSubmittedMessage))
				.pipe(replace('$$DefaultWelcomeMessage$$', config.DefaultWelcomeMessage))
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

	var htaccessFile = gulp.src('./src/.htaccess')
		.pipe(replace('$$RewriteUrl$$', config.RewriteUrl))
		.pipe(gulp.dest('./dist'));
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
	  .pipe(replace('$$BaseUrl$$', config.BaseUrl))
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
	gulp.watch('./src/**/*.{js,html}', ['default'])
    //gulp.watch('src/*.{js,coffee}', ['scripts']);
});