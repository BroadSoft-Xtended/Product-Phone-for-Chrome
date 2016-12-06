module.exports = function(grunt) {

  grunt.config.set(
    'jscs', {
      src: [
        'Gruntfile.js',
        'app/**/*.js',
        'api/**/*.js',
        '!**/bower_components/**',
        '!**/node_modules/**',
        '!app/assets/**'
      ],
      options: {
        config: '.jscsrc',
        verbose: true,
        fix: true
      }
    });

  grunt.loadNpmTasks('grunt-jscs');
};
