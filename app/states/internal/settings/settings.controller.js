(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings', {

      url: '/settings',

      templateUrl: '/app/states/internal/settings/settings.template.html',

      resolve: {},

      controller: ['$rootScope', function ($rootScope) {
        console.log('in the settings controller');

        $rootScope.settings = true;
      }]
    });
  }]);
})();
