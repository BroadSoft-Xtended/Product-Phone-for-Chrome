/**
 * Run predefined tasks whenever watched file patterns are added, changed or deleted.
 *
 * ---------------------------------------------------------------
 *
 * Watch for changes on
 * - files in the `app` folder
 * - the `tasks/pipeline.js` file
 * and re-run the appropriate tasks.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-watch
 *
 */
module.exports = function(grunt) {

	grunt.config.set('watch', {
		api: {
			// API files to watch:
			files: ['api/**/*', '!**/node_modules/**']
		},
		app: {
			// Assets to watch:
			files: ['app/**/*', 'tasks/pipeline.js', '!**/node_modules/**', '!**/bower_components/**'],

			// When app are changed:
			tasks: ['syncAssets', 'compileAssets', 'linkAssets']
		}
	});
  console.log('this grunt task');

	grunt.loadNpmTasks('grunt-contrib-watch');
};
