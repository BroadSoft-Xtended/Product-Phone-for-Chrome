(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings', {

      url: '/settings',

      templateUrl: '/app/states/internal/settings/settings.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSDirectory', function ($rootScope, $scope, BSDirectory) {
        console.log('in the settings controller');

        $rootScope.settings = true;
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
