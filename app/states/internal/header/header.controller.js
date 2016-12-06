(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header', {

      url: '/header',

      templateUrl: '/states/internal/header/header.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSPersonalAssistant', function ($rootScope, $scope, BSPersonalAssistant) {
        console.log('in the header controller');
        console.log('Your language is:', $rootScope.language);
        $scope.searchText = '';
        $scope.searchContactsList = [];

        $scope.stateList = BSPersonalAssistant.getUserStates();

        BSPersonalAssistant.getPersonalAssistantData().then(function(results){
          $scope.personalAssistantResults = results;
          $scope.selectedStatus = results.presence;
        });

        $scope.statusChange = function(){
          console.log($scope.selectedStatus);
          var params = $scope.personalAssistantResults;
          params.presence = $scope.selectedStatus;
          params.enableExpirationTime = false;

          BSPersonalAssistant.setPersonalAssistantData(params).then(function(){
            console.log('Status set');
          });
        }
      }]
    });
  }]);
})();

