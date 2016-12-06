(function(){
  'use strict';
  ucone.factory('Media', ['$rootScope', 'Storage', '$state', function($rootScope, Storage, $state){
    var service = this;

    service.startVideoCall = function(contact){
      if($rootScope.registeredWRS){
        $rootScope.video = true;
        Storage.setValue('currentCallContact', contact);
        $state.go('app.videoCall', {contact: contact, makeCall: true, displayVideo: true});
      }
      else{
        return 'error';
      }
    };

    service.startAudioCall = function(contact){
      if($rootScope.registeredWRS){
        $rootScope.video = false;
        Storage.setValue('currentCallContact', contact);
        $state.go('app.videoCall', {contact: contact, makeCall: true, displayVideo: false});
      }
      else{
        return 'error';
      }
    };

    return service;
  }]);
})();
