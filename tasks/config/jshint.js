module.exports = function(grunt) {
  grunt.config.set(
    'jshint', {
      files: [
        'Gruntfile.js',
        'app/**/*.js',
        'api/**/*.js',
        '!**/bower_components/**',
        '!**/node_modules/**',
        '!app/assets/**'
      ]
    });

  grunt.loadNpmTasks('grunt-contrib-jshint');
};
