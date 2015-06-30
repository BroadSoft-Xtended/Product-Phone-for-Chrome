var cssFilesToInject = [
  'assets/dependencies/font-awesome/css/font-awesome.min.css',
  'app/**/*.less'
];

var jsFilesToInject = [
  'main.js',
  'app/**/*controller.js',
  'app/**/*directive.js',
  'app/**/*factory.js',
  'app/**/*filter.js',
  'locals/**/*.js'
];

var templateFilesToInject = [
  'app/**/*.html'
];

module.exports.cssFilesToInject = cssFilesToInject.map(function (path) {
  return path;
});
module.exports.jsFilesToInject = jsFilesToInject.map(function (path) {
  return path;
});
module.exports.templateFilesToInject = templateFilesToInject.map(function (path) {
  return path;
});
