(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('splash', {

      url: '/',

      templateUrl: '/app/states/splash/splash.template.html',

      resolve: {
        avoidSplash: ['$state', function($state){
          chrome.storage.local.get(function(storage){
            if(storage.avoidSplash){
              $state.go('login');
            }
          });
        }]
      },

      controller: ['$rootScope', '$scope', '$interval', function ($rootScope, $scope, $interval) {
        console.log('in the splash controller');

        if(!$scope.userAction){
          $interval(function(){
            $scope.splashIndex = $scope.splashIndex < 2 ? $scope.splashIndex + 1 : 0;
          }, 10000)
        }

        $scope.avoidSplash = function(){
          chrome.storage.local.set({avoidSplash: true});
        }
      }]
    });
  }]);
})();
