(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app', {

      url: '/app',

      templateUrl: '/states/internal/app.template.html',

      resolve: {},

      controller: ['$rootScope', '$state', 'BSSip', 'Storage', 'webRTC', 'Auth', 'Utility', '$document', '$cookies',
        function ($rootScope, $state, BSSip, Storage, webRTC, Auth, Utility, $document, $cookies) {
          console.log('in the app controller');

          //Prevent backspace from going to the login.
          $document.unbind('keydown').bind('keydown', function (event) {
            var doPrevent = false;
            if (event.keyCode === 8) {
              var d = event.srcElement || event.target;
              if ((d.tagName.toUpperCase() === 'INPUT' &&
                  (
                  d.type.toUpperCase() === 'TEXT' ||
                  d.type.toUpperCase() === 'PASSWORD' ||
                  d.type.toUpperCase() === 'FILE' ||
                  d.type.toUpperCase() === 'EMAIL' ||
                  d.type.toUpperCase() === 'SEARCH' ||
                  d.type.toUpperCase() === 'DATE' )
                ) ||
                d.tagName.toUpperCase() === 'TEXTAREA') {
                doPrevent = d.readOnly || d.disabled;
              }
              else {
                doPrevent = true;
              }
            }

            if (doPrevent) {
              event.preventDefault();
            }
          });

          window.addEventListener("onClosed", function(){
            webRTC.hangUp('call1');
            webRTC.hangUp('call2');
            webRTC.stop();
            $rootScope.username = undefined;
            $rootScope.authdata = undefined;
          });

          window.addEventListener("onMinimized", function(){
            $rootScope.minimized = true;
          });

          window.addEventListener("onRestored", function(){
            console.log('onResized fired', chrome.app.window.current().isMinimized());
            if(!$rootScope.minimized){
              Utility.setChromeToMinSize();
            }
            $rootScope.minimized = false;
          });

          //Force the user to be logged in to access the app

          if(!$rootScope.username || !$rootScope.password){
            console.log('invalid username or authdata');
            $state.go('login', {message: 'Login-InvalidError'});
          }

          //Initialize the webRtc connection for incoming calls
          console.log('init webrtc');
          BSSip.getSIPConfig().then(function(sipConfig){
            console.log('getting the webrtc config', sipConfig);
            $cookies.putObject('sipConfig', sipConfig);

            Auth.setConfig().then(function(config){
              console.log('the config for the user', config);
              webRTC.init(config).then(function(userAgent){
              });
            });
          }).catch(function(error){
            console.error(error);
          });

          $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            console.error('Error transitioning to state: \'' + toState.name + '\'...');
            console.error('Additional debugging:\n\n');
            console.error('-> toState:', toState);
            console.error('-> fromState:', fromState);
            console.error('-> toParams:', toParams);
            console.error('-> fromParams:', fromParams);
            console.error('-> error:', error);
            console.error('-> event:', event);
          });

          $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            console.log('Missing state: \'' + unfoundState + '\'...');
            console.log('Additional debugging:\n\n');
            console.log('-> event', event);
            console.log('-> unfoundState:', unfoundState);
            console.log('-> fromState:', fromState);
            console.log('-> fromParams', fromParams);
          });
        }]
    });
  }]);
})();
