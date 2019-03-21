const { src, dest, watch, parallel } = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const server = require('browser-sync');

function js() {
	return src('src/js/**/*.js', { sourcemaps: true })
		.pipe(plumber())
		.pipe(
			babel({
				plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'h' }]]
			})
		)
		.pipe(dest('build/js', { sourcemaps: true }))
		.pipe(server.stream());
}

function css() {
	return src('src/sass/main.scss', { sourcemaps: true })
		.pipe(plumber())
		.pipe(sass())
		.pipe(dest('build/css', { sourcemaps: true }))
		.pipe(server.stream());
}

function serve() {
	server.init({
		server: {
			baseDir: './'
		},
		notify: false
	});

	watch('src/js/**/*.js', js);
	watch('src/sass/**/*.scss', css);
	watch('./index.html').on('change', server.reload);
}

exports.css = css;
exports.js = js;
exports.serve = serve;
exports.default = parallel(css, js, serve);
