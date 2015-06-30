(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.videoCall', {

      url: '/videoCall',
      params: {contact: null, makeCall: null, displayVideo: null},

      templateUrl: '/app/states/internal/videoCall/videoCall.template.html',

      resolve: {},

      controller: ['$scope', '$interval', '$timeout', '$rootScope', 'webRTC', '$state', 'Utility', 'BSDirectory', 'BSConference',
        function ($scope, $interval, $timeout, $rootScope, webRTC, $state, Utility, BSDirectory, BSConference) {
          console.log('in the videoCall controller');
          $scope.muted = false;
          $scope.video = true;
          $scope.held = false;
          $scope.showDialPad = false;
          $scope.showSearchTransfer = false;
          $scope.showSearchAdd = false;
          $scope.showAcceptDecline = false;
          $scope.showSelfVideo = true;
          $scope.searchContactsList = [];
          $scope.state = $state;
          $scope.rtc = webRTC;
          Utility.setChromeToVideoSize();
          $scope.call1Active = true;
          $scope.pendingNumber = '';

          $rootScope.$on('apply', function(){
            $scope.$apply();
          });

          $rootScope.$on('sessionReady', function(e, event){
            $scope.pendingNumber = '';

            console.log('fired', event);

            if(document.querySelector('#dtmfRingBack')){
              document.querySelector('#dtmfRingBack').pause();
            }
            var sender = event.sender;
            var localStreams = sender.getLocalStreams();
            if (localStreams.length > 0) {
              var selfVideo = document.getElementById('selfVideo');
              selfVideo.src = window.URL.createObjectURL(localStreams[0]);
            }
            var remoteStreams = sender.getRemoteStreams();
            if (remoteStreams.length > 0) {
              var remoteVideo1 = document.getElementById('remoteVideo1');
              remoteVideo1.src = window.URL.createObjectURL(remoteStreams[0]);
              if(remoteStreams.length > 1){
                var remoteVideo2 = document.getElementById('remoteVideo2');
                remoteVideo2.src = window.URL.createObjectURL(remoteStreams[1]);
              }
            }

            $scope.$apply();
          });

          if($state.params.makeCall){
            //Make a call on page load
            document.querySelector('#dtmfRingBack').play();
            $scope.contact = $state.params.contact;
            $scope.pendingNumber = $scope.contact.number;
            webRTC.makeCall($scope.contact.number, $state.params.displayVideo);
            console.log('show video', $state.params.displayVideo);
          }

          $scope.addNewCall = function(number){
            console.log('calling a new number', number);

            webRTC.hold('call1');
            webRTC.call1.active = false;
            webRTC.call2.active = true;

            document.querySelector('#dtmfRingBack').play();

            webRTC.makeCall(number, true);
          };


          $scope.activateCall = function(activeCall){
            if(activeCall == 'call1'){
              console.log('activating call 1');
              webRTC.unhold('call1');
              webRTC.hold('call2');
              webRTC.call1.active = true;
              webRTC.call2.active = false;
            }
            if(activeCall == 'call2'){
              console.log('activating call 2');
              webRTC.unhold('call2');
              webRTC.hold('call1');
              webRTC.call1.active = false;
              webRTC.call2.active = true;
            }
          };

          $scope.joinCalls = function(){
            BSConference.start();
          };

          $scope.playDtmf = function(number, session){
            if(number === '#'){
              document.querySelector('#dtmfHash').play();
            }
            else if(number === '*'){
              document.querySelector('#dtmfStar').play();
            }
            else{
              document.querySelector('#dtmf' + number).play();
            }
            webRTC.sendDTMF(number, session);
          };

          $scope.searchContacts = function(){
            if(event.keyCode == 27){
              $scope.searchContactsList = [];
              $scope.searchText = '';
            }

            BSDirectory.searchDirectoryContacts($scope.searchText, 1, 7).then(function(results){
              $scope.searchContactsList = results;
            });
          };

          $scope.transferCall = function(number, session){
            webRTC.transfer(number, session);
            $state.go('app.header.main.favs');
          };

          $scope.hideActionPanels = function(){
            $scope.showDialPad = false;
            $scope.showSearchTransfer = false;
            $scope.showSearchAdd = false;
          }
      }]
    });
  }]);
})();
