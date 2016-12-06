module.exports = function(grunt) {
	grunt.config.set('uglify', {
		dist: {
      options: {
        mangle: false,
        beautify: true
      },
			src: ['dist/concat/production.js'],
			dest: 'dist/production.min.js'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};
