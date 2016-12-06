module.exports = function(grunt) {

  grunt.config.set('watch', {
    watch: {
      files: ['app/**/*', 'locals/**/*', 'main.js', 'background.js', 'index.html', 'videoCallRedirect.html'],
      tasks: [
        // 'concat',
        // 'uglify',
        'less',
        // 'cssmin',
        'watch'
      ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
};
