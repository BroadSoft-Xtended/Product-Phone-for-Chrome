(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.vip', {

      url: '/vip',

      templateUrl: '/states/internal/vip/vip.template.html',

      resolve: {},

      controller: ['$scope', 'BSPersonalAssistant', 'BSDirectory', function ($scope, BSPersonalAssistant, BSDirectory) {
        console.log('in the vip controller');

        $scope.getAllNumbers = function(){
          BSPersonalAssistant.getExclusionNumbers().then(function(contacts){
            $scope.exlusionNumbers = contacts;
          });
        };

        $scope.addVip = function(contact){
          $scope.searchVipContactsList = [];
          $scope.vipSearchText = '';
          BSPersonalAssistant.addExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.removeVip = function(contact){
          BSPersonalAssistant.deleteExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.searchVipContacts = function(){
          if($scope.vipSearchText.match(/^[0-9 ]+$/) != null){
            $scope.showAddButton = true;
          }

          if(event.keyCode == 27){
            $scope.searchVipContactsList = [];
            $scope.vipSearchText = '';
          }

          BSDirectory.searchDirectoryContacts($scope.vipSearchText, 1, 5).then(function(results){
            $scope.searchVipContactsList = results;
          });
        };

        $scope.getAllNumbers();
      }]
    });
  }]);
})();
