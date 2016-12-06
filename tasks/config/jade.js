module.exports = function(grunt) {

  grunt.config.set('jade', {
    compile: {
      options: {
        client: false,
        pretty: true
      },
      files: [ {
        cwd: "app/states",
        src: "**/*.template.jade",
        dest: ".tmp/public/states",
        expand: true,
        ext: ".template.html"
      } ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
};
