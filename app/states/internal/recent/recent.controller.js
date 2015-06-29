(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.recent', {

      url: '/recent',

      templateUrl: '/app/states/internal/recent/recent.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'Media', 'BSCallLogs', function ($rootScope, $scope, Media, BSCallLogs) {
        console.log('in the recent controller');
        $scope.spinner = true;
        $scope.media = Media;

        BSCallLogs.getData().then(function(results){
          $scope.spinner = false;
          $scope.contacts = results;
        });
      }]
    });
  }]);
})();
