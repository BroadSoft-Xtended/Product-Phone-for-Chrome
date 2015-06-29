(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.voicemailSettings', {

      url: '/voicemailSettings',

      templateUrl: '/app/states/internal/voicemailSettings/voicemailSettings.template.html',

      resolve: {},

      controller: [function () {
        console.log('in the voicemailSettings controller');

      }]
    });
  }]);
})();
