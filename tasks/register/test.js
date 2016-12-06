module.exports = function(grunt) {
  grunt.config.set('karma', {
    unit: {
      configFile: 'karma.conf.js',
      singleRun: true,
      options: {
        files: [
          "bower_components/angular/angular.js",
          'bower_components/angular-mocks/angular-mocks.js',
          "bower_components/angular-ui-router/release/angular-ui-router.min.js",
          "bower_components/angular-route/angular-route.js",
          "bower_components/underscore/underscore-min.js",

          'index.html',
          'app.js',
          'test/**/*',
          'directives/**/*',
          'factories/**/*',
          'includes/**/*',
          'states/**/*',
          'styles/**/*'

        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.registerTask('test', ['karma']);
};
