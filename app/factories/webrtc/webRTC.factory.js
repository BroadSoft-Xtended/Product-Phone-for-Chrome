(function(){
  'use strict';
  ucone.factory('webRTC', ['$q', 'Storage', '$rootScope', '$state', 'Utility', 'Auth', function($q, Storage, $rootScope, $state, Utility, Auth){
    var service = {};
    var userAgent;

    service.call1 = {session: null, active: false};
    service.call2 = {session: null, active: false};

    var isVideo = false;
    var configuration;

    service.stop = function(){
      userAgent.stop();
    };

    service.toggleVideo = function(isVideo, session){
      var options1 = {
        'mediaConstraints' : {
          'audio' : true,
          'video' : isVideo
        },
        'createOfferConstraints' : {
          'mandatory' : {
            'OfferToReceiveAudio' : true,
            'OfferToReceiveVideo' : isVideo
          }
        }
      };

      if (userAgent.isConnected() && session) {
        userAgent.getUserMedia(options1, function(localStream) {

          var options2 = {
            'localMedia' : localStream,
            'createOfferConstraints' : {
              'mandatory' : {
                'OfferToReceiveAudio' : true,
                'OfferToReceiveVideo' : isVideo
              }
            }
          };

          var selfVideo = document.getElementById('selfVideo');
          selfVideo.src = window.URL.createObjectURL(localStream);
          session.changeSession(options2, function() {
            console.log('change session succeeded');
          }, function() {
            console.log('change session failed');
          });
        },function(){
          console.log('getUserMedia success');
        },function(error){
          console.log('getUserMedia error', error);
        }, true);
      }
    };

    service.connected = function(event){
      console.log('connected');
    };

    service.disconnected = function(event){
      console.log('disconnected');
      service.call1.session.terminate();
      service.call1 = {session: null, active: false};

      service.call2.session.terminate();
      service.call2 = {session: null, active: false};

      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.registered = function(event){
      $rootScope.registeredWRS = true;
      console.log('registered');
    };

    service.registrationFailed = function(event){
      $rootScope.registeredWRS = false;
      console.log('registrationFailed');
    };

    service.onReInvite = function(event){
      console.log(event);
      event.data.session.acceptReInvite();
    };

    service.progress = function(event){
      console.log('progress');
    };

    service.failed = function(event){
      console.log('failed event', event);
      if(service.call1.session){
        service.call1.session.terminate();
      }
      service.call1 = {session: null, active: false};

      if(service.call2.session){
        service.call2.session.terminate();
      }
      service.call1 = {session: null, active: false};
      service.call2 = {session: null, active: false};
      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.started = function(event){
      //comes back from the server evnt
      console.log('broadcasting...');
      $rootScope.$broadcast('sessionReady', event);
    };

    service.resumed = function(event){
      console.log('resumed');
    };

    service.held = function(event){
      console.log('held');
    };

    service.ended = function(event){
      console.log('ended');
      isVideo = false;
      service.call1 = {session: null, active: false};
      service.call2 = {session: null, active: false};
      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.newDTMF = function(){
      console.log('new dtmf');
    };

    service.incomingCall = function(event){
      console.log('incoming call from');
      var name = service.call1.session.remote_identity.display_name || service.call2.session.remote_identity.display_name;
      $state.go('app.incomingCall', {displayName: name});
    };

    service.makeCall = function(phoneNumber, displayVideo){
      var options = {
        'mediaConstraints': {'audio': true, 'video': displayVideo}
      };

      console.log('make call to: ', phoneNumber);
      userAgent.call(phoneNumber, options);
    };

    service.accept = function(videoEnabled){
      $state.go('app.videoCall');

      var options = {
        'mediaConstraints' : {
          'audio' : true,
          'video' : videoEnabled
        },
        'createOfferConstraints' : {
          'mandatory' : {
            'OfferToReceiveAudio' : true,
            'OfferToReceiveVideo' : videoEnabled
          }
        }
      };

      if(service.call1.session){
        service.call1.session.answer(options);
      }
      else if(service.call2.session){
        service.call2.session.answer(options);
      }
    };

    service.decline = function(){
      if(service.call1.session){
        service.call1.session.terminate();
        service.call1 = {session: null, active: false};
      }

      if(service.call2.session){
        service.call2.session.terminate();
        service.call2 = {session: null, active: false};
      }

      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.hold = function(session){
      session.hold(function(){
        console.log('success');
        return true;
      }, function(error){
        console.log('error');
        console.log(error);
      });
    };

    service.unhold = function(session){
      session.unhold(function(){
        console.log('success');
        return true;
      }, function(error){
        console.log('error');
        console.log(error);
      });
    };

    service.transfer = function(number, session, type){
      if(type === 'call1'){
        service.call1 = {session: null, active: false};
      }

      if(type === 'call2'){
        service.call2 = {session: null, active: false};
      }

      userAgent.transfer(number, session);
      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.attendedTransfer = function(number, session) {
      userAgent.attendedTransfer(number, session);
    };

    service.hangUp = function(type){
      if(type === 'call1'){
        service.call1.session.terminate();
        service.call1 = {session: null, active: false};
      }

      if(type === 'call2'){
        service.call2.session.terminate();
        service.call2 = {session: null, active: false};
      }

      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.sendDTMF = function(digit, session) {
      var codes = {'0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '#': '#', '*': '*'};

      if(service.call1.active){
        session.sendDTMF(codes[digit], {duration: 200, interToneGap: 50});
      }

      if(service.call2.active){
        session.sendDTMF(codes[digit], {duration: 200, interToneGap: 50});
      }
    };

    service.muteAudio = function(isMuted, session){
      var localStreams = session ? session.getLocalStreams() : null;
      if(!localStreams) {
        return;
      }
      var localMedia = localStreams[0];
      var localAudio = localMedia.getAudioTracks()[0];
      localAudio.enabled = !isMuted;
    };

    service.init = function(sipConfig){
      var defer = $q.defer();

      configuration = sipConfig;

      userAgent = new ExSIP.UA(configuration);
      userAgent.setRtcMediaHandlerOptions({
        'reuseLocalMedia' : false,
        'videoBandwidth': 2048,
        'disableICE' : true,
        'RTCConstraints' : {
          'optional' : [ {
            'DtlsSrtpKeyAgreement' : true
          } ],
          'mandatory' : {}
        }
      });

      userAgent.on('connected', function(event){service.connected(event);});
      userAgent.on('disconnected', function(event){service.disconnected(event);});
      userAgent.on('registered', function(event){
        service.registered(event);
        defer.resolve(userAgent);
      });
      userAgent.on('registrationFailed', function(event){service.registrationFailed(event);});
      userAgent.on('onReInvite', function(event){service.onReInvite(event);});
      userAgent.on('newRTCSession', function(e){
        var session = e.data.session;

        session.on('progress', function(event) {service.progress(event);});
        session.on('failed', function(event) {service.failed(event);});
        session.on('started', function(event) {service.started(event);});
        session.on('resumed', function(event) {service.resumed(event);});
        session.on('held', function(event) {service.held(event);});
        session.on('ended', function(event) {service.ended(event);});
        session.on('newDTMF', function(event) {service.newDTMF(event);});

        if(service.call1.session == null){
          console.log('set 1');
          service.call1 = {session: session, active: true};
        }
        else{
          console.log('set 2');
          service.call2 = {session: session, active: true};
        }

        if (session.direction === 'incoming') {service.incomingCall(e);}
      });

      userAgent.start();


      return defer.promise;
    };

    return service;
  }]);
})();
