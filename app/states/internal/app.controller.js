(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app', {

      url: '/app',

      templateUrl: '/app/states/internal/app.template.html',

      resolve: {},

      controller: ['$rootScope', '$state', 'BSSip', 'Storage', 'webRTC', 'Auth', function ($rootScope, $state, BSSip, Storage, webRTC, Auth) {
        console.log('in the app controller');

        chrome.app.window.current().onClosed.addListener(function(){
          webRTC.hangUp('call1');
          webRTC.hangUp('call2');
          webRTC.stop();
          $rootScope.username = undefined;
          $rootScope.authdata = undefined;
        });

        //Force the user to be logged in to access the app
        chrome.storage.local.get(function(storage){
          if(!$rootScope.username || !$rootScope.authdata){
            console.log('invalid username or authdata');
            $state.go('login', {message: 'Invalid username or password.'});
          }
        });

        //Initialize the webRtc connection for incoming calls
        BSSip.getSIPConfig().then(function(sipConfig){
          Storage.setValue('sipConfig', sipConfig);

          Auth.setConfig().then(function(config){
            console.log('the config for the user', config);
            webRTC.init(config).then(function(userAgent){
            });
          });
        });

        $rootScope.language = 'en';

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

