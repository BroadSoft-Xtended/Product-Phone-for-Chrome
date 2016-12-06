module.exports = function (grunt) {
  grunt.registerTask('prod', [
    'concat',
    'uglify',
    'less',
    'cssmin',
    'watch'
  ]);
};
