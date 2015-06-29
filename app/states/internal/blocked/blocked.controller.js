(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.blocked', {

      url: '/blocked',

      templateUrl: '/app/states/internal/blocked/blocked.template.html',

      resolve: {},

      controller: ['$scope', 'BSAnonymousCallRejection', 'BSSelectiveCallRejection', 'BSDirectory', function ($scope, BSAnonymousCallRejection, BSSelectiveCallRejection, BSDirectory) {
        console.log('in the blocked controller');

        $scope.togglePrivateCalls = function(value){
          BSSelectiveCallRejection.addBlockedNumber({firstName: 'PrivateCalls', lastName: '', private: $scope.privateCalls, number: '0001'}).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.toggleAnonymousCalls = function(value){
          BSSelectiveCallRejection.addBlockedNumber({firstName: 'AnonymousCalls', lastName: '', anonymous: $scope.anonymousCalls, number: '0001'}).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.getAllBlockedNumbers = function(){
          BSSelectiveCallRejection.get().then(function(contacts){
            $scope.contacts = contacts;
            $scope.privateCalls = _.findWhere(contacts, {privateCalls: 'true'}) !== undefined;
            $scope.anonymousCalls = _.findWhere(contacts, {anonymousCalls: 'true'}) !== undefined;
          });
        };

        $scope.addBlocked = function(contact){
          $scope.searchContactsList = [];
          $scope.searchText = '';

          console.log(contact.number);

          BSSelectiveCallRejection.addBlockedNumber(contact).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.removeBlocked = function(contact){
          BSSelectiveCallRejection.remove(contact).then(function(){
            $scope.getAllBlockedNumbers();
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

          BSDirectory.searchDirectoryContacts($scope.searchText, 1, 4).then(function(results){
            $scope.searchContactsList = results;
          });
        };

        $scope.getAllBlockedNumbers();
      }]
    });
  }]);
})();

