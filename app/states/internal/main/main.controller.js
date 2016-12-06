(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main', {

      url: '/main',

      templateUrl: '/states/internal/main/main.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', '$state', 'BSDirectory', 'Media', function ($rootScope, $scope, $state, BSDirectory, Media) {
        console.log('in the main controller');
        $scope.bsPageStart = 1;
        $scope.searchContactsList = [];
        $scope.media = Media;
        $scope.showCallButton = false;
        $rootScope.settings = false;
        $scope.searchText = '';

        $scope.makeSearchCall = function(){
          Media.startAudioCall({number: $scope.searchText});
        };

        $scope.searchContacts = function(event){
          if(event.keyCode == 27){
            $scope.searchContactsList = [];
            $scope.searchText = '';
          }
          else{
            BSDirectory.searchDirectoryContacts($scope.searchText, 1, 8).then(function(results){
              console.log('res', results);
              $scope.searchContactsList = results;
            });
          }
        };

        $scope.getBroadsoftContacts = function(){
          BSDirectory.searchDirectoryContacts($scope.searchText, $scope.bsPageStart, 8).then(function(contacts){
            $scope.bsPageStart += 8;
            $scope.searchContactsList = $scope.searchContactsList.concat(contacts);
          });
        };

        $scope.loadMoreContacts = function(contacts, index){
          if(index >= contacts.length - 8){
            $scope.getBroadsoftContacts();
          }
        };
      }]
    });
  }]);
})();
