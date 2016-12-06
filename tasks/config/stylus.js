module.exports = function(grunt) {

  grunt.config.set('stylus', {
    build: {
      options: {
        linenos: true,
        compress: false
      },
      files: [{
        expand: true,
        cwd: 'app/styles',
        src: [ '**/*.styl' ],
        dest: '.tmp/public/styles',
        ext: '.css'
      }]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-stylus');
};
