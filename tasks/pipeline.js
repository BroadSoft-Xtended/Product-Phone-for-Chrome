// CSS files to inject in order
//
// (if you're using LESS with the built-in default config, you'll want
//  to change `app/styles/importer.less` instead.)
var cssFilesToInject = [
  "assets/dependencies/font-awesome/css/font-awesome.min.css",
  "assets/dependencies/font-awesome/fonts/FontAwesome.otf",
  'styles/**/*.css',
  'styles/**/*.styl'
];

// Client-side javascript files to inject in order
// (uses Grunt-style wildcard/glob/splat expressions)
var jsFilesToInject = [

  "bower_components/angular/angular.min.js",
  "bower_components/angular-ui-router/release/angular-ui-router.min.js",
  "bower_components/angular-base64/angular-base64.min.js",
  "bower_components/angular-cookies/angular-cookies.min.js",
  "bower_components/underscore/underscore-min.js",
  "assets/webrtcLibraries/exsip-devel.js",

  // All of the rest of your client-side js files
  // will be injected here in no particular order.
  'app.js',
  'locals/*.js',
  '**/*.directive.js',
  '**/*.filter.js',
  '**/*.factory.js',
  'states/**/*.controller.js'
];

var templateFilesToInject = [
  'states/**/*.html',
  'states/**/*.jade'
];

module.exports.cssFilesToInject = cssFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.jsFilesToInject = jsFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.templateFilesToInject = templateFilesToInject.map(function(path) {
  return 'app/' + path;
});
