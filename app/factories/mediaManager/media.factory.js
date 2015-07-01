(function(){
  'use strict';
  ucone.factory('Media', ['$rootScope', 'Storage', '$state', function($rootScope, Storage, $state){
    var service = this;

    service.startVideoCall = function(contact){
      if($rootScope.registeredWRS){
        Storage.setValue('currentCallContact', contact);
        $state.go('app.videoCall', {contact: contact, makeCall: true, displayVideo: true});
      }
    };

    service.startAudioCall = function(contact){
      if($rootScope.registeredWRS){
        Storage.setValue('currentCallContact', contact);
        $state.go('app.videoCall', {contact: contact, makeCall: true, displayVideo: false});
      }
    };

    return service;
  }]);
})();
