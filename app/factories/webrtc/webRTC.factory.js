(function(){
  'use strict';
  ucone.factory('webRTC', ['$q', 'Storage', '$rootScope', '$state', 'Utility', 'Auth', function($q, Storage, $rootScope, $state, Utility, Auth){
    var service = {};
    var userAgent;
    service.sessions = [];

    service.call1 = {session: null, active: false};
    service.call2 = {session: null, active: false};

    var isVideo = false;
    var configuration;

    service.getSessions = function(){
      //Return the items needed for the for loop in the UI
      return service.sessions;
    };

    service.stop = function(){
      userAgent.stop();
    };

    service.toggleVideo = function(isVideo){
      var options = {
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
        userAgent.getUserMedia(options, function(localStream) {
          console.log('in the get user media');
          var options = {
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
          session.changeSession(options, function() {
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
      //if(session){session.terminate();}
      //session = null;
    };

    service.registered = function(event){
      $rootScope.registeredWRS = true;
      console.log('registered');
    };

    service.registrationFailed = function(event){
      //Emit an error for registration failing
      //Need to keep retrying this connection here
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
      console.log('sessions failed', service.sessions);
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
      //console.log(sessions[event.sender.id]);
    };

    service.ended = function(event){
      console.log('ended');
      //Stop the ringtone
      _.each(service.sessions, function(session){
        session.session.terminate();
      });

      service.sessions = [];
      isVideo = false;
      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.newDTMF = function(){
      console.log('new dtmf');
    };

    service.incomingCall = function(event){
      $state.go('app.incomingCall', {displayName: session.remote_identity.display_name});
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

      if(session){
        session.answer(options);
      }
    };

    service.decline = function(){
      if(session){session.terminate();}
      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.hold = function(type){
      if(type === 'call1'){
        service.call1.session.hold(function(){
          console.log('success');
        }, function(error){
          console.log('error');
          console.log(error);
        });
      }

      if(type === 'call2'){
        service.call2.session.hold(function(){
          console.log('success');
        }, function(error){
          console.log('error');
          console.log(error);
        });
      }
    };

    service.unhold = function(type){
      if(type === 'call1'){
        service.call1.session.unhold(function(){
          console.log('success');
        }, function(error){
          console.log('error');
          console.log(error);
        });
      }

      if(type === 'call2'){
        service.call2.session.unhold(function(){
          console.log('success');
        }, function(error){
          console.log('error');
          console.log(error);
        });
      }
    };

    service.transfer = function(number){
      userAgent.transfer(number, session);
    };

    service.attendedTransfer = function(number) {
      userAgent.attendedTransfer(number, session);
    };

    service.join = function(){
      //needs to be N-Way
    };

    service.hangUp = function(){
      _.each(service.sessions, function(item){
        item.session.terminate();
      });
      service.sessions = [];

      Utility.setChromeToMinSize();
      $state.go('app.header.main.favs');
    };

    service.sendDTMF = function(digit) {
      var codes = {'0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57, '#': '#', '*': '*'};

      if(service.call1.active){
        call1.session.sendDTMF(codes[digit], {duration: 200, interToneGap: 50});
      }

      if(service.call2.active){
        call2.session.sendDTMF(codes[digit], {duration: 200, interToneGap: 50});
      }
    };

    service.muteAudio = function(isMuted){
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
        if (session.direction === 'incoming') {service.incomingCall(e);}

        if(service.call1.session == null){
          console.log('set 1');
          service.call1 = {session: session, active: true};
        }
        else{
          console.log('set 2');
          service.call2 = {session: session, active: true};
        }
      });

      userAgent.start();


      return defer.promise;
    };

    return service;
  }]);
})();
