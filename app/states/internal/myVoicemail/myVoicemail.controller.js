(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.myVoicemail', {

      url: '/myVoicemail',

      templateUrl: '/states/internal/myVoicemail/myVoicemail.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {
        console.log('in the my Voicemail controller');
        $scope.searchText = '';
        $scope.searchContactsList = [];

        $scope.messages = [{firstName: 'Billy', lastName: 'Boy'}, {firstName: 'Eric', lastName: 'Larsen'}, {firstName: 'Janet', lastName: 'Johnson'}]
      }]
    });
  }]);
})();
