module.exports = function(grunt) {

	grunt.config.set('cssmin', {
		dist: {
			src: ['dist/less/importer.css', 'assets/webrtcLibraries/stylesheet.css'],
			dest: 'dist/production.min.css'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-cssmin');
};
