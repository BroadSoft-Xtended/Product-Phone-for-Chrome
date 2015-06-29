(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.vip', {

      url: '/vip',

      templateUrl: '/app/states/internal/vip/vip.template.html',

      resolve: {},

      controller: ['$scope', 'BSPersonalAssistant', 'BSDirectory', function ($scope, BSPersonalAssistant, BSDirectory) {
        console.log('in the vip controller');

        $scope.getAllNumbers = function(){
          BSPersonalAssistant.getExclusionNumbers().then(function(contacts){
            $scope.exlusionNumbers = contacts;
          });
        };

        $scope.addVip = function(contact){
          $scope.searchContactsList = [];
          $scope.searchText = '';
          BSPersonalAssistant.addExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.removeVip = function(contact){
          BSPersonalAssistant.deleteExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.searchContacts = function(){
          if($scope.searchText.match(/^[0-9 ]+$/) != null){
            $scope.showAddButton = true;
          }

          if(event.keyCode == 27){
            $scope.searchContactsList = [];
            $scope.searchText = '';
          }

          BSDirectory.searchDirectoryContacts($scope.searchText, 1, 5).then(function(results){
            $scope.searchContactsList = results;
          });
        };

        $scope.getAllNumbers();
      }]
    });
  }]);
})();
