var gulp		= require('gulp'), // Подключаем Gulp
	sass		= require('gulp-sass'), //Подключаем Sass пакет,
	browserSync	= require('browser-sync'), // Подключаем Browser Sync
	concat		= require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
	//uglify	= require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
	uglify		= require('gulp-uglify-es').default;
	cssnano		= require('gulp-cssnano'), // Подключаем пакет для минификации CSS
	rename		= require('gulp-rename'), // Подключаем библиотеку для переименования файлов
	del			= require('del'), // Подключаем библиотеку для удаления файлов и папок
	imagemin	= require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant	= require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache		= require('gulp-cache'), // Подключаем библиотеку кеширования
	autoprefixer = require('gulp-autoprefixer'),// Подключаем библиотеку для автоматического добавления префиксов
	bourbon		= require('bourbon'),
	gutil		= require('gulp-util'); // для FTP
	ftp			= require('vinyl-ftp'), // FTP
	notify		= require('gulp-notify');


gulp.task('sass', function(){ // Создаем таск Sass
	return gulp.src([ // Берем источник
		'app/sass/main.sass',
	]) 
	.pipe(sass({
		includePaths: bourbon.includePaths
	}).on("error", notify.onError()))
	.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true })) // Создаем префиксы
	.pipe(cssnano({ zindex: false })) // Сжимаем
	.pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
	.pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
	.pipe(browserSync.reload({stream: true})); // Обновляем CSS на странице при изменении
});

/*gulp.task('browser-sync', function() { // Для работы под openserver
	browserSync({ // Выполняем browserSync
		proxy: 'domain.ru', // ЗАМЕНИТЬ НА СВОЙ ДОМЕН
		notify: false // Отключаем уведомления
	});
});*/

gulp.task('browser-sync', function() { // Для работы БЕЗ openserver
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});

gulp.task('common-js', function() {
	return gulp.src([
		'app/js/scripts.js',
	])
	.pipe(concat('scripts.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function() {
	return gulp.src([
		'app/libs/jquery/jquery.min.js',
		'app/libs/js.cookie.js',
		'app/libs/slick/slick.min.js',
		// Любые другие скрипты
	])
	.pipe(concat('libs.min.js'))
	.pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({ stream: true }));
});

gulp.task('css-libs', ['sass'], function() {
	return gulp.src([
		'app/css/libs.css',
		'app/libs/slick/slick.css',
		'app/libs/slick/slick-theme.css',
	]) // Выбираем файл для минификации
	.pipe(concat('libs.min.css'))
	.pipe(cssnano({ zindex: false })) // Сжимаем
	.pipe(gulp.dest('app/css')); // Выгружаем в папку app/css
});

gulp.task('watch', ['sass', 'css-libs', 'js', 'browser-sync'], function() {
	gulp.watch('gulpfile.js', ['js']); // Наблюдение за gulpfile.js
	gulp.watch('app/sass/**/*.sass', ['sass']); // Наблюдение за sass файлами в папке sass
	gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
	gulp.watch('app/js/scripts.js', ['js', browserSync.reload]);   // Наблюдение за JS файлами в папке js
	gulp.watch('app/**/*.php', browserSync.reload);   // Наблюдение за php
});

gulp.task('img', function() {
	return gulp.src('app/img/**/*') // Берем все изображения из app
		.pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('app/img')); // Выгружаем на продакшен
});

gulp.task('build', ['css-libs', 'clean', 'img', 'sass', 'js'], function() {

	var buildCss = gulp.src([ // Переносим библиотеки в продакшен
		'app/css/**/*.css',
		'app/css/**/*.svg',
		'app/css/**/*.min.css'
		])
	.pipe(gulp.dest('dist/css'))

	var buildFonts = gulp.src('app/fonts/**/*') // Переносим шрифты в продакшен
	.pipe(gulp.dest('dist/fonts'))

	var buildJs = gulp.src('app/js/**/*') // Переносим скрипты в продакшен
	.pipe(gulp.dest('dist/js'))

	var buildPHP = gulp.src('app/*.php') // Переносим PHP в продакшен
		.pipe(gulp.dest('dist'));

	var buildHtaccess = gulp.src('app/.htaccess') // Переносим PHP в продакшен
		.pipe(gulp.dest('dist'));

	var buildIco = gulp.src('app/*.ico') // Переносим favicon ico в продакшен
		.pipe(gulp.dest('dist'));

	var buildIco = gulp.src('app/*.png') // Переносим favicon png в продакшен
		.pipe(gulp.dest('dist'));

	var buildIMG = gulp.src('app/img/**/*') // Берем все изображения из app
		.pipe(gulp.dest('dist/img')); // Выгружаем на продакшен
});

gulp.task( 'deploy', ['css-libs', 'img', 'sass', 'js'], function() {
	var conn = ftp.create( {
		host:      '255.255.255.255',
		user:      'user',
		password:  'password',
		parallel: 	1,
		log:      	gutil.log
	} );
	var globs = [
		'dist/**',
		'dist/.htaccess',
	];
	// using base = '.' will transfer everything to /public_html correctly
	// turn off buffering in gulp.src for best performance

	return gulp.src( globs, { buffer: false } )
		.pipe( conn.newer( '/domains/path' ) ) // only upload newer files
		.pipe( conn.dest( '/domains/path' ) );
});

gulp.task('clean', function() {
	return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('clear', function (callback) {
	return cache.clearAll();
});

gulp.task('default', ['watch']);