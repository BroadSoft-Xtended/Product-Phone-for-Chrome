(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.contacts', {

      url: '/contacts',

      templateUrl: '/app/states/internal/contacts/contacts.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSDirectory', 'Media', 'LocalContacts', function ($rootScope, $scope, BSDirectory, Media, LocalContacts) {
        console.log('in the contacts controller');
        $scope.bsPageStart = 1;
        $scope.telephoneContacts = [];
        $scope.media = Media;
        $scope.foo = {};

        $scope.getBroadsoftContacts = function(){
          BSDirectory.getDirectoryContacts($scope.bsPageStart, 50).then(function(contacts){
            $scope.bsPageStart += 50;
            $scope.telephoneContacts = $scope.telephoneContacts.concat(contacts);
          });
        };

        $scope.loadMoreContacts = function(contacts, index){
          if(index >= contacts.length - 8){
            $scope.getBroadsoftContacts();
          }
        };

        //Run on page start
        $scope.getBroadsoftContacts();

        $scope.addToContactFavs = function(contact){
          $scope.foo = {};
          LocalContacts.add(contact);
          $scope.openPopup = false;
        }

        //Set for debugging
        window.$scope = $scope;
      }]
    });
  }]);
})();

