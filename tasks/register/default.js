module.exports = function (grunt) {
	grunt.registerTask('default', [
		'concat',
		'uglify',
		'less',
		'cssmin',
		'watch'
	]);
};
