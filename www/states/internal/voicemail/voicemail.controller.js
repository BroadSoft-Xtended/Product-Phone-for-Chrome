(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.voicemail', {

      url: '/voicemail',

      templateUrl: '/app/states/internal/voicemail/voicemail.template.html',

      resolve: {},

      controller: [function () {
        console.log('in the voicemail controller');

      }]
    });
  }]);
})();

