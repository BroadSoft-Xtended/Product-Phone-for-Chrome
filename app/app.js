var ucone = angular.module('ucone', ["ui.router", "base64", "ngCookies"], function($provide) {
  // Prevent Angular from sniffing for the history API
  // since it's not supported in packaged apps.
  $provide.decorator('$window', function($delegate) {
    $delegate.history = null;
    return $delegate;
  });
});

ucone.config(function($stateProvider, $urlRouterProvider, $compileProvider){

  // For any unmatched url, send to /route1
  //$urlRouterProvider.otherwise("/app/header/main/favs");
  //$urlRouterProvider.otherwise("/app/header/settings/incoming");
  $urlRouterProvider.otherwise("/login");
  //$urlRouterProvider.otherwise("/app/videoCall");

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
});
