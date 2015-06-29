module.exports = function(grunt) {

	grunt.config.set('concat', {
		js: {
			src: require('../pipeline').jsFilesToInject,
			dest: 'dist/concat/production.js'
		},
		css: {
			src: require('../pipeline').cssFilesToInject,
			dest: 'dist/concat/production.css'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
};
