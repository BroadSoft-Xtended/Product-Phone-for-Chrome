module.exports = function (grunt) {
  grunt.config.set('ngAnnotate', {
    options: {
      // Task-specific options go here.
    },
    prod: {
      files: [
        {
          expand: true,
          src: [
            '.tmp/public/concat/production.js'
          ]
        }
      ]
    }
  });

  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.registerTask('annotate', ['ngAnnotate']);
};
