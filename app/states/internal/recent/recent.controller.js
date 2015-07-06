(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.recent', {

      url: '/recent',

      templateUrl: '/app/states/internal/recent/recent.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'Media', 'BSCallLogs', 'LocalContacts', function ($rootScope, $scope, Media, BSCallLogs, LocalContacts) {
        console.log('in the recent controller');
        $scope.spinner = true;
        $scope.media = Media;
        $scope.foo = {};

        BSCallLogs.getData().then(function(results){
          $scope.spinner = false;
          $scope.contacts = results;
        });


      }]
    });
  }]);
})();
