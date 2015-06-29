(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.contacts', {

      url: '/contacts',

      templateUrl: '/app/states/internal/contacts/contacts.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSDirectory', 'Media', function ($rootScope, $scope, BSDirectory, Media) {
        console.log('in the contacts controller');
        $scope.bsPageStart = 1;
        $scope.telephoneContacts = [];
        $scope.media = Media;

        $scope.googleContacts = [{imageUrl: 'assets/images/sampleFace.png', firstName: 'Albert1', lastName: 'Sanchez', status: 'away'},
          {imageUrl: 'assets/images/sampleFace.png', firstName: 'Albert2', lastName: 'Sanchez', status: 'offline'},
          {imageUrl: 'assets/images/sampleFace.png', firstName: 'Albert3', lastName: 'Sanchez', status: 'available'}];


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

        //Set for debugging
        window.$scope = $scope;
      }]
    });
  }]);
})();

