(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.incomingCall', {

      url: '/incomingCall',
      params: {displayName: null},
      templateUrl: '/app/states/internal/incomingCall/incomingCall.template.html',
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', 'webRTC', 'Utility', function ($rootScope, $scope, $state, webRTC, Utility) {
        console.log('in the incoming call controller');

        $scope.rtc = webRTC;
        $scope.util = Utility;

        $scope.displayName = $state.params.displayName || 'Unknown';

      }]
    });
  }]);
})();
