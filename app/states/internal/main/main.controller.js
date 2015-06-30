(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main', {

      url: '/main',

      templateUrl: '/app/states/internal/main/main.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', '$state', 'BSDirectory', 'Media', function ($rootScope, $scope, $state, BSDirectory, Media) {
        console.log('in the main controller');
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
            BSDirectory.searchDirectoryContacts($scope.searchText, 1, 7).then(function(results){
              console.log('res', results);
              $scope.searchContactsList = results;
            });
          }
        };
      }]
    });
  }]);
})();
