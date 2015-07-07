var ucone = angular.module('ucone', ["ui.router", "base64"], function($provide) {
  // Prevent Angular from sniffing for the history API
  // since it's not supported in packaged apps.
  $provide.decorator('$window', function($delegate) {
    $delegate.history = null;
    return $delegate;
  });
});

ucone.config(function($stateProvider, $urlRouterProvider, $compileProvider){

  // For any unmatched url, send to /route1
  //$urlRouterProvider.otherwise("/app/header/main/favs");
  //$urlRouterProvider.otherwise("/app/header/settings/incoming");
  $urlRouterProvider.otherwise("/login");
  //$urlRouterProvider.otherwise("/app/videoCall");

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
});
(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app', {

      url: '/app',

      templateUrl: '/app/states/internal/app.template.html',

      resolve: {},

      controller: ['$rootScope', '$state', 'BSSip', 'Storage', 'webRTC', 'Auth', 'Utility', function ($rootScope, $state, BSSip, Storage, webRTC, Auth, Utility) {
        console.log('in the app controller');

        chrome.app.window.current().onClosed.addListener(function(){
          webRTC.hangUp('call1');
          webRTC.hangUp('call2');
          webRTC.stop();
          $rootScope.username = undefined;
          $rootScope.authdata = undefined;
        });

        chrome.app.window.current().onRestored.addListener(function(){
          console.log('onResized fired');
          Utility.setChromeToMinSize();
        });

        //Force the user to be logged in to access the app
        chrome.storage.local.get(function(storage){
          if(!$rootScope.username || !$rootScope.authdata){
            console.log('invalid username or authdata');
            $state.go('login', {message: 'Login-InvalidError'});
          }
        });

        //Initialize the webRtc connection for incoming calls
        BSSip.getSIPConfig().then(function(sipConfig){
          Storage.setValue('sipConfig', sipConfig);

          Auth.setConfig().then(function(config){
            console.log('the config for the user', config);
            webRTC.init(config).then(function(userAgent){
            });
          });
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
          console.error('Error transitioning to state: \'' + toState.name + '\'...');
          console.error('Additional debugging:\n\n');
          console.error('-> toState:', toState);
          console.error('-> fromState:', fromState);
          console.error('-> toParams:', toParams);
          console.error('-> fromParams:', fromParams);
          console.error('-> error:', error);
          console.error('-> event:', event);
        });

        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
          console.log('Missing state: \'' + unfoundState + '\'...');
          console.log('Additional debugging:\n\n');
          console.log('-> event', event);
          console.log('-> unfoundState:', unfoundState);
          console.log('-> fromState:', fromState);
          console.log('-> fromParams', fromParams);
        });
      }]
    });
  }]);
})();


(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.blocked', {

      url: '/blocked',

      templateUrl: '/app/states/internal/blocked/blocked.template.html',

      resolve: {},

      controller: ['$scope', 'BSAnonymousCallRejection', 'BSSelectiveCallRejection', 'BSDirectory', function ($scope, BSAnonymousCallRejection, BSSelectiveCallRejection, BSDirectory) {
        console.log('in the blocked controller');

        $scope.togglePrivateCalls = function(value){
          BSSelectiveCallRejection.addBlockedNumber({firstName: 'PrivateCalls', lastName: '', private: $scope.privateCalls, number: '0001'}).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.toggleAnonymousCalls = function(value){
          BSSelectiveCallRejection.addBlockedNumber({firstName: 'AnonymousCalls', lastName: '', anonymous: $scope.anonymousCalls, number: '0001'}).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.getAllBlockedNumbers = function(){
          BSSelectiveCallRejection.get().then(function(contacts){
            $scope.contacts = contacts;
            $scope.privateCalls = _.findWhere(contacts, {privateCalls: 'true'}) !== undefined;
            $scope.anonymousCalls = _.findWhere(contacts, {anonymousCalls: 'true'}) !== undefined;
          });
        };

        $scope.addBlocked = function(contact){
          $scope.searchBlockedContactsList = [];
          $scope.blockedSearchText = '';

          console.log(contact.number);

          BSSelectiveCallRejection.addBlockedNumber(contact).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.removeBlocked = function(contact){
          BSSelectiveCallRejection.remove(contact).then(function(){
            $scope.getAllBlockedNumbers();
          });
        };

        $scope.searchBlockedContacts = function(){
          if($scope.blockedSearchText.match(/^[0-9 ]+$/) != null){
            $scope.showAddButton = true;
          }

          if(event.keyCode == 27){
            $scope.searchBlockedContactsList = [];
            $scope.blockedSearchText = '';
          }

          BSDirectory.searchDirectoryContacts($scope.blockedSearchText, 1, 4).then(function(results){
            $scope.searchBlockedContactsList = results;
          });
        };

        $scope.getAllBlockedNumbers();
      }]
    });
  }]);
})();


(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.contacts', {

      url: '/contacts',

      templateUrl: '/app/states/internal/contacts/contacts.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSDirectory', 'Media', 'LocalContacts', function ($rootScope, $scope, BSDirectory, Media, LocalContacts) {
        console.log('in the contacts controller');
        $scope.bsPageStart = 1;
        $scope.telephoneContacts = [];
        $scope.media = Media;
        $scope.foo = {};

        $scope.getBroadsoftContacts = function(){
          BSDirectory.getDirectoryContacts($scope.bsPageStart, 50).then(function(contacts){
            $scope.bsPageStart += 50;
            $scope.telephoneContacts = $scope.telephoneContacts.concat(contacts);
          });
        };

        $scope.loadMoreContacts = function(contacts, index){
          if(index >= contacts.length - 8){
            $scope.getBroadsoftContacts();
          }
        };

        //Run on page start
        $scope.getBroadsoftContacts();

        $scope.addToContactFavs = function(contact){
          $scope.foo = {};
          LocalContacts.add(contact);
          $scope.openPopup = false;
        }

        //Set for debugging
        window.$scope = $scope;
      }]
    });
  }]);
})();


(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.favs', {

      url: '/favs',

      templateUrl: '/app/states/internal/favs/favs.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'LocalContacts', 'Utility', '$timeout', function ($rootScope, $scope, LocalContacts, Utility, $timeout) {
        console.log('in the favs controller');

        //$timeout(function(){
        //  Utility.setChromeToMinSize();
        //});


        LocalContacts.get().then(function(contacts){
          $scope.contacts = contacts;
          console.log('fav contacts: ', contacts);
        });

        $rootScope.$on('favsChanged', function(){
          LocalContacts.get().then(function(contacts){
            $scope.contacts = contacts;
            console.log('fav contacts: ', contacts);
          });
        })
      }]
    });
  }]);
})();

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header', {

      url: '/header',

      templateUrl: '/app/states/internal/header/header.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSPersonalAssistant', function ($rootScope, $scope, BSPersonalAssistant) {
        console.log('in the header controller');
        console.log('Your language is:', $rootScope.language);
        $scope.searchText = '';
        $scope.searchContactsList = [];

        $scope.stateList = BSPersonalAssistant.getUserStates();

        BSPersonalAssistant.getPersonalAssistantData().then(function(results){
          $scope.personalAssistantResults = results;
          $scope.selectedStatus = results.presence;
        });

        $scope.statusChange = function(){
          console.log($scope.selectedStatus);
          var params = $scope.personalAssistantResults;
          params.presence = $scope.selectedStatus;
          params.enableExpirationTime = false;

          BSPersonalAssistant.setPersonalAssistantData(params).then(function(){
            console.log('Status set');
          });
        }
      }]
    });
  }]);
})();


(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.incoming', {

      url: '/incoming',

      templateUrl: '/app/states/internal/incoming/incoming.template.html',

      resolve: {},

      controller: ['$scope', 'Utility', 'BSPersonalAssistant', 'BSCallForwardAlways', 'BSCallNotify', function ($scope, Utility, BSPersonalAssistant, BSCallForwardAlways, BSCallNotify) {
        console.log('in the incoming controller');
        $scope.Utility = Utility;
        $scope.stateList = BSPersonalAssistant.getUserStates();

        BSPersonalAssistant.getPersonalAssistantData().then(function(results){
          $scope.personalAssistantData = results;
        });

        BSCallForwardAlways.getData().then(function(results){
          $scope.callForwardAlways = results;
        });

        BSCallNotify.getData().then(function(results){
          $scope.callNotifyEmail = results;
        });

        $scope.setPersonalAssistantData = function(){
          var params = {
            presence: $scope.personalAssistantData.presence,
            enableExpirationTime: $scope.personalAssistantData.enableExpirationTime,
            expirationTime: Utility.formatDate($scope.personalAssistantData.expirationDate, $scope.personalAssistantData.expirationTime),
            enableTransferToAttendant: $scope.personalAssistantData.attendantNumber !== '' ? 'true' : 'false',
            attendantNumber: $scope.personalAssistantData.attendantNumber,
            ringSplash: $scope.personalAssistantData.ringSplash
          };

          BSPersonalAssistant.setPersonalAssistantData(params).then(function(results){
            $scope.personalAssistantData = results;
          })
        };

        $scope.setCallForwardAlways = function(){
          BSCallForwardAlways.setNumber($scope.callForwardAlways).then(function(results){});
        };

        $scope.setCallNotify = function(){
          BSCallNotify.setCallNotify($scope.callNotifyEmail).then(function(results){
            $scope.callNotifyEmail = results;
          });
        };
      }]
    });
  }]);
})();

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.incomingCall', {

      url: '/incomingCall',
      params: {displayName: null},
      templateUrl: '/app/states/internal/incomingCall/incomingCall.template.html',
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', 'webRTC', 'Utility', function ($rootScope, $scope, $state, webRTC, Utility) {
        console.log('in the incoming call controller');

        $scope.rtc = webRTC;
        $scope.util = Utility;

        $scope.displayName = $state.params.displayName || 'Unknown';

      }]
    });
  }]);
})();

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main', {

      url: '/main',

      templateUrl: '/app/states/internal/main/main.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', '$state', 'BSDirectory', 'Media', function ($rootScope, $scope, $state, BSDirectory, Media) {
        console.log('in the main controller');
        $scope.searchContactsList = [];
        $scope.media = Media;
        $scope.showCallButton = false;
        $rootScope.settings = false;
        $scope.searchText = '';

        $scope.makeSearchCall = function(){
          Media.startAudioCall({number: $scope.searchText});
        };

        $scope.searchContacts = function(event){
          if(event.keyCode == 27){
            $scope.searchContactsList = [];
            $scope.searchText = '';
          }
          else{
            BSDirectory.searchDirectoryContacts($scope.searchText, 1, 7).then(function(results){
              console.log('res', results);
              $scope.searchContactsList = results;
            });
          }
        };
      }]
    });
  }]);
})();

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.myVoicemail', {

      url: '/myVoicemail',

      templateUrl: '/app/states/internal/myVoicemail/myVoicemail.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {
        console.log('in the my Voicemail controller');
        $scope.searchText = '';
        $scope.searchContactsList = [];

        $scope.messages = [{firstName: 'Billy', lastName: 'Boy'}, {firstName: 'Eric', lastName: 'Larsen'}, {firstName: 'Janet', lastName: 'Johnson'}]
      }]
    });
  }]);
})();

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

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings', {

      url: '/settings',

      templateUrl: '/app/states/internal/settings/settings.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'BSDirectory', function ($rootScope, $scope, BSDirectory) {
        console.log('in the settings controller');

        $rootScope.settings = true;
        $scope.searchText = '';

        $scope.makeSearchCall = function(){
          Media.startAudioCall({number: $scope.searchText});
        };

        $scope.searchContacts = function(event){
          if(event.keyCode == 27){
            $scope.searchContactsList = [];
            $scope.searchText = '';
          }
          else{
            BSDirectory.searchDirectoryContacts($scope.searchText, 1, 7).then(function(results){
              console.log('res', results);
              $scope.searchContactsList = results;
            });
          }
        };
      }]
    });
  }]);
})();

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

          $rootScope.$on('progressEventFired', function(e, event){
            console.log('caught the progress event');
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

            webRTC.hold(webRTC.call1.session);
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

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.vip', {

      url: '/vip',

      templateUrl: '/app/states/internal/vip/vip.template.html',

      resolve: {},

      controller: ['$scope', 'BSPersonalAssistant', 'BSDirectory', function ($scope, BSPersonalAssistant, BSDirectory) {
        console.log('in the vip controller');

        $scope.getAllNumbers = function(){
          BSPersonalAssistant.getExclusionNumbers().then(function(contacts){
            $scope.exlusionNumbers = contacts;
          });
        };

        $scope.addVip = function(contact){
          $scope.searchVipContactsList = [];
          $scope.vipSearchText = '';
          BSPersonalAssistant.addExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.removeVip = function(contact){
          BSPersonalAssistant.deleteExclusionNumber(contact).then(function(){
            $scope.getAllNumbers();
          });
        };

        $scope.searchVipContacts = function(){
          if($scope.vipSearchText.match(/^[0-9 ]+$/) != null){
            $scope.showAddButton = true;
          }

          if(event.keyCode == 27){
            $scope.searchVipContactsList = [];
            $scope.vipSearchText = '';
          }

          BSDirectory.searchDirectoryContacts($scope.vipSearchText, 1, 5).then(function(results){
            $scope.searchVipContactsList = results;
          });
        };

        $scope.getAllNumbers();
      }]
    });
  }]);
})();

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

(function(){
  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('login', {

      url: '/login',

      templateUrl: '/app/states/login/login.template.html',
      params: {message: null},
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', '$http', 'Auth', 'Utility', 'Storage', function ($rootScope, $scope, $state, $http, Auth, Utility, Storage) {
        console.log('in the login controller');
        $scope.spinner = false;

        Utility.setChromeToMinSize();

        chrome.storage.local.get(function(storage){
          if(storage.LoginUrl){
            $scope.xsp = storage.LoginUrl
          }
          if(storage.LoginEmail){
            $scope.email = storage.LoginEmail
          }
          $scope.$apply();
        });

        $rootScope.language = Utility.getBrowserLanguage();

        if($state.params.message){
          $scope.errorMessage = $state.params.message;
        }

        $scope.rememberLoginUrlAndEmail = function(){
          Storage.setValue('LoginUrl', $scope.xsp);
          Storage.setValue('LoginEmail', $scope.email);
        };

        $scope.broadsoftLogin = function(login){
          $scope.rememberLoginUrlAndEmail();
          console.log('bsft login');
          login.$pristine = false;
          if(login.$valid){
            Auth.setCredentials($scope.email, $scope.password, $scope.xsp);

            $http.get($rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $scope.email + '/directories/Enterprise').success(function(response){
              $state.go('app.header.main.favs');
            }).error(function(error){
              $scope.spinner = false;
              console.log('Login Error', error);
              $scope.errorMessage = 'InvalidUserNamePassword';
              login.$valid = false;
            });
          }
          else{
            $scope.spinner = false;
            $scope.errorMessage = 'InvalidUserNamePassword'
          }
        };

      }]
    });
  }]);
})();

(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('splash', {

      url: '/',

      templateUrl: '/app/states/splash/splash.template.html',

      resolve: {
        avoidSplash: ['$state', function($state){
          chrome.storage.local.get(function(storage){
            if(storage.avoidSplash){
              $state.go('login');
            }
          });
        }]
      },

      controller: ['$rootScope', '$scope', '$interval', function ($rootScope, $scope, $interval) {
        console.log('in the splash controller');

        if(!$scope.userAction){
          $interval(function(){
            $scope.splashIndex = $scope.splashIndex < 2 ? $scope.splashIndex + 1 : 0;
          }, 10000)
        }

        $scope.avoidSplash = function(){
          chrome.storage.local.set({avoidSplash: true});
        }
      }]
    });
  }]);
})();

(function() {
  'use strict';

  ucone.directive('contactActions', function(Media, LocalContacts, $rootScope){
    return {
      scope: {
        contact: '=',
        deleteMode: '=',
        show: '='
      },
      templateUrl: '/app/directives/contactActions/contactActions.template.html',
      link: function(scope, element, attrs){
        scope.media = Media;

        scope.addToFavs = function(contact){
          console.log('add');
          LocalContacts.add(contact).then(function(){
            scope.openPopup = false;
            $rootScope.$broadcast('favsChanged');
          });
        };

        scope.removeFav = function(index){
          console.log('remove');
          LocalContacts.delete(index).then(function(contacts){
            $rootScope.$broadcast('favsChanged');
          });
        };
      }
    }
  });
})();


(function() {
  'use strict';

  ucone.directive('contactCircle', function(Utility){
    return {
      scope: {
        contact: '='
      },
      templateUrl: '/app/directives/contactCircle/contactCircle.template.html',
      link: function(scope, element, attrs){
        scope.getContactLetter = function(contact){
          return Utility.getFirstLetter(contact.firstName || contact.name || contact.description);
        }
      }
    }
  });
})();


(function(){
  'use strict';

  angular.module('ucone').directive('ngEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if(event.which === 13) {
          scope.$apply(function(){
            scope.$eval(attrs.ngEnter, {'event': event});
          });

          event.preventDefault();
        }
      });
    };
  });
})();

(function(){
  'use strict';

  ucone.factory('Auth', ['$base64', '$rootScope', '$http', 'Storage', '$q', function($base64, $rootScope, $http, Storage, $q){
    var service = {};

    service.clearCredentials = function () {
      $http.defaults.headers.common.Authorization = 'Basic ';
      $rootScope.username = '';
      $rootScope.authdata = '';
    };

    service.setCredentials = function (username, password, xsp) {
      service.clearCredentials();

      var authdata = $base64.encode(username + ':' + password);

      $rootScope.xsp = xsp;
      $rootScope.username = username;
      $rootScope.authdata = authdata;

      console.log(username);
      console.log($rootScope.username);

      $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
    };

    service.setConfig = function(){
      var defer = $q.defer();
      var configuration;

      chrome.storage.local.get(function(storage){
        configuration = {
          'ws_servers' : [ {
            'ws_uri' : storage.sipConfig.primaryWrsAddress,
            'weight' : 0
          } ],
          'uri' : storage.sipConfig.sipLineport,
          'auth_user': storage.sipConfig.sipUsername,
          'authorization_user': storage.sipConfig.sipUsername,
          'password': storage.sipConfig.sipPassword,
          'stun_servers': storage.sipConfig.primaryStunServer,
          'trace_sip' : true,
          'displayName': (_.unescape(storage.sipConfig.userFirstName + ' ' + storage.sipConfig.userLastName)).replace("&apos;", "'")
        };

        console.log("the user's config: ", configuration);

        $rootScope.userFirstName = storage.sipConfig.userFirstName;

        defer.resolve(configuration);
      });

      return defer.promise;
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSAnonymousCallRejection', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.set = function (value) {
      var apiName = '/services/AnonymousCallRejection';
      var defer = $q.defer();

      var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><AnonymousCallRejection xmlns="http://schema.broadsoft.com/xsi"><active>' + value + '</active></AnonymousCallRejection>';

      var req = {
        method: 'PUT',
        url: baseUrl + $rootScope.username + apiName,
        headers: {
          'Accept': 'text/xml',
          'Content-Type': 'text/xml'
        },
        data: xmlParams
      };

      $http(req)
        .success(function(response){
          defer.resolve(value);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.get = function () {
      var apiName = '/services/AnonymousCallRejection';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(response.AnonymousCallRejection.active.$ == 'true');
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSCallForwardAlways', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.getData = function () {
      var apiName = '/services/CallForwardingAlways?';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          var number = (typeof response.CallForwardingAlways.forwardToPhoneNumber !== 'undefined') ? response.CallForwardingAlways.forwardToPhoneNumber.$ : '';
          defer.resolve(number);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.setNumber = function(number){
      var apiName = '/services/CallForwardingAlways?';
      var defer = $q.defer();

      number = number || '';

      var active = !!number;

      var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><CallForwardingAlways xmlns="http://schema.broadsoft.com/xsi"><active>' + active + '</active><forwardToPhoneNumber>' + number + '</forwardToPhoneNumber><ringSplash>' + active + '</ringSplash></CallForwardingAlways>';
      if(number === ''){ xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><CallForwardingAlways xmlns="http://schema.broadsoft.com/xsi"><active>' + active + '</active><ringSplash>' + active + '</ringSplash></CallForwardingAlways>';}

      var req = {
        method: 'PUT',
        url: baseUrl + $rootScope.username + apiName,
        headers: {'Accept': 'text/xml','Content-Type': 'text/xml'},
        data: xmlParams
      };

      $http(req)
        .success(function(){
          defer.resolve(number);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSCallLogs', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.formatCall = function(call, type){
      var callLogId = call.callLogId ? call.callLogId.$ : '';
      var countryCode = call.countryCode ? call.countryCode.$ : '';
      var name = call.name ? call.name.$ : '';
      var number = call.phoneNumber ? call.phoneNumber.$ : '';
      var time = call.time ? call.time.$ : '';

      var formattedTime = time.split('T')[0] + ' ' + time.split('T')[1].substring(0, 8);

      return {callLogId: callLogId, countryCode: countryCode, name: name, number: number, time: formattedTime, type: type}
    };

    service.formatCallLogs = function(CallLogs){
      var calls = [];

      _.each(CallLogs.missed.callLogsEntry, function(call){
        calls.push(service.formatCall(call, 'missed'));
      });

      _.each(CallLogs.placed.callLogsEntry, function(call){
        calls.push(service.formatCall(call, 'placed'));
      });

      _.each(CallLogs.received.callLogsEntry, function(call){
        calls.push(service.formatCall(call, 'received'));
      });

      return _.sortBy(calls, 'time').reverse();
    };

    service.getData = function () {
      var apiName = '/directories/CallLogs';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          console.log(service.formatCallLogs(response.CallLogs));
          defer.resolve(service.formatCallLogs(response.CallLogs));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSCallNotify', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.getData = function(){
      var apiName = '/services/callnotify/?';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          var email = (typeof response.CallNotify.callNotifyEmailAddress !== 'undefined') ? response.CallNotify.callNotifyEmailAddress.$ : '';
          defer.resolve(email);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.setCallNotify = function(email){
      var apiName = '/services/callnotify/?';
      var defer = $q.defer();

      var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><CallNotify xmlns="http://schema.broadsoft.com/xsi"><callNotifyEmailAddress>'+email+'</callNotifyEmailAddress></CallNotify>';

      var req = {
        method: 'PUT',
        url: baseUrl + $rootScope.username + apiName,
        headers: {
          'Accept': 'text/xml',
          'Content-Type': 'text/xml'
        },
        data: xmlParams
      };

      $http(req)
        .success(function(response){
          defer.resolve(email);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSConference', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    service.start = function () {
      var callIds = [];
      var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $rootScope.username + '/calls/Conference';

      $http.get('https://xsp1.ihs.broadsoft.com/com.broadsoft.xsi-actions/v2.0/user/jodonnell@broadsoft.com/calls')
        .success(function(results){
          _.each(results.Calls.call, function(call){
            callIds.push({uri: call.uri.$, callId: call.callId.$});
          });

          var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><Conference xmlns="http://schema.broadsoft.com/xsi"><conferenceParticipantList><conferenceParticipant><callId>' + callIds[0].callId + '</callId></conferenceParticipant><conferenceParticipant><callId>' + callIds[1].callId + '</callId></conferenceParticipant></conferenceParticipantList></Conference>';

          var req = {
            method: 'POST',
            url: baseUrl,
            headers: {
              'Accept': 'text/xml',
              'Content-Type': 'text/xml'
            },
            data: xmlParams
          };

          $http(req)
            .success(function(response){
              console.log('Conference Started ', callIds);
            }).error(function(error){
              console.log(error);
            });

        }).error(function(error){
          console.log('did not get the calls: ', error);
        });
    };

    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSDirectory', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.initBroadsoftContacts = function (BSFTContacts) {
      var allContacts = [];
      if(BSFTContacts.constructor === Array){
        allContacts = BSFTContacts;
      }
      else{
        allContacts = [BSFTContacts];
      }

      var contacts = [];
      _.each(allContacts, function(contact){
        var firstName = contact.firstName ? contact.firstName.$ : '';
        var lastName = contact.lastName ? contact.lastName.$ : '';
        var number = contact.number ? contact.number.$ : '';
        var id = contact.userId ? contact.userId.$ : '';
        var mobileNumber = contact.additionalDetails ? contact.additionalDetails.mobile ? contact.additionalDetails.mobile.$ : '' : '';

        contacts.push({firstName: firstName, lastName: lastName, number: number, id: id, mobileNumber: mobileNumber});
      });

      return contacts;
    };

    service.getDirectoryContacts = function (pageStart, pageSize) {
      var apiName = '/directories/Enterprise?';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName + 'start=' + pageStart + '&results=' + pageSize)
        .success(function(response){
          defer.resolve(service.initBroadsoftContacts(response.Enterprise.enterpriseDirectory.directoryDetails));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.searchDirectoryContacts = function(searchText, pageStart, pageSize){
      var apiName = '/directories/Enterprise?';
      var defer = $q.defer();
      var lastName, firstName, searchWithOr;

      if(!searchText){
        defer.resolve([]);
        return defer.promise;
      }

      if(searchText.indexOf(' ') > -1){
        firstName = searchText.split(' ')[0];
        lastName = searchText.split(' ')[1];
        searchWithOr = false;
      }
      else{
        firstName = searchText;
        lastName = searchText;
        searchWithOr = true;
      }

      $http.get(baseUrl + $rootScope.username + apiName + 'searchCriteriaModeOr=' + searchWithOr + '&firstName=*' + firstName + '*/i&lastName=*' + lastName + '*/i&start=' + pageStart +'&results=' + pageSize)
        .success(function(response){
          defer.resolve(service.initBroadsoftContacts(response.Enterprise.enterpriseDirectory.directoryDetails));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };



    return service;
  }]);
})();


(function(){
  'use strict';

  ucone.factory('BSPersonalAssistant', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.formatPAData = function(data){
      var ringSplash = (typeof data.ringSplash !== 'undefined') ? data.ringSplash.$ === "true" : false;
      var presence = (typeof data.presence !== 'undefined') ? data.presence.$ : 'Available';
      var attendantNumber = (typeof data.attendantNumber !== 'undefined') ? data.attendantNumber.$ : '';
      var expirationDate = (typeof data.expirationTime !== 'undefined') ? data.expirationTime.$.split('T')[0] : '';
      var expirationTime = (typeof data.expirationTime !== 'undefined') ? data.expirationTime.$.split('T')[1].substr(0, 5) : '';
      var enableExpirationTime = (typeof data.enableExpirationTime !== 'undefined') ? data.enableExpirationTime.$ === "true" : '';

      return {
        ringSplash: ringSplash,
        presence: presence,
        attendantNumber: attendantNumber,
        expirationDate: expirationDate,
        expirationTime: expirationTime,
        enableExpirationTime: enableExpirationTime
      }
    };

    service.getPersonalAssistantData = function(){
      var apiName = '/services/personalassistant';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(service.formatPAData(response.PersonalAssistant));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.setPersonalAssistantData = function(params){
        var apiName = '/services/personalassistant';
        var defer = $q.defer();

        params.enableExpirationTime = params.enableExpirationTime ? 'true': 'false';
        params.ringSplash = params.ringSplash ? 'true': 'false';
        params.enableTransferToAttendant = params.enableTransferToAttendant ? 'true': 'false';

        var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><PersonalAssistant xmlns="http://schema.broadsoft.com/xsi"><presence>'+ params.presence +'</presence><enableExpirationTime>'+ params.enableExpirationTime +'</enableExpirationTime><expirationTime>'+ params.expirationTime +'</expirationTime><enableTransferToAttendant>'+ params.enableTransferToAttendant +'</enableTransferToAttendant><attendantNumber>'+ params.attendantNumber +'</attendantNumber><ringSplash>'+ params.ringSplash +'</ringSplash></PersonalAssistant>';

        console.log('foo', params.expirationTime);

        if(params.enableExpirationTime === 'false'){
          xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><PersonalAssistant xmlns="http://schema.broadsoft.com/xsi"><presence>'+ params.presence +'</presence><enableExpirationTime>'+ params.enableExpirationTime +'</enableExpirationTime><enableTransferToAttendant>'+ params.enableTransferToAttendant +'</enableTransferToAttendant><attendantNumber>'+ params.attendantNumber +'</attendantNumber><ringSplash>'+ params.ringSplash +'</ringSplash></PersonalAssistant>';
        }

        console.log(xmlParams);

        var req = {
          method: 'PUT',
          url: baseUrl + $rootScope.username + apiName,
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml'
          },
          data: xmlParams
        };

        $http(req)
          .success(function(response){
            service.getPersonalAssistantData().then(function(response){
              defer.resolve(response);
            });
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });

        return defer.promise;
    };

    service.getUserStates = function(){
      return [{value: 'None', text: 'Available'},
      {value: 'Business Trip', text: 'BusinessTrip'},
      {value: 'Gone for the Day', text: 'GoneForTheDay'},
      {value: 'Lunch', text: 'Lunch'},
      {value: 'Meeting', text: 'Meeting'},
      {value: 'Out Of Office', text: 'OutOfOffice'},
      {value: 'Temporarily Out', text: 'TemporarilyOut'},
      {value: 'Training', text: 'Training'},
      {value: 'Unavailable', text: 'Unavailable'},
      {value: 'Vacation', text: 'Vacation'}];
    };

    service.formatExclusionNumberList = function(list){
      var newList;

      if(!list){
        return [];
      }

      if(list.constructor === Array){
         newList = list
      }
      else{
         newList = [list];
      }

      var results = [];
      _.each(newList, function(item){
        console.log('item', item);
        results.push({description: item.description.$, number: item.number.$});
      });

      return results;
    };

    service.getExclusionNumbers = function(){
      var apiName = '/services/personalassistant/exclusionnumberlist';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(service.formatExclusionNumberList(response.PersonalAssistantExclusionNumberList.exclusionNumber));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.deleteExclusionNumber = function(contact){
      var apiName = '/services/personalassistant/exclusionnumber/' + contact.number;
      var defer = $q.defer();

      $http.delete(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(contact.number + ' deleted');
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.addExclusionNumber = function(contact){
      var apiName = '/services/personalassistant/exclusionnumber';
      var defer = $q.defer();

      var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><PersonalAssistantExclusionNumber xmlns="http://schema.broadsoft.com/xsi"><number>' + contact.number + '</number><description>' + contact.firstName + ' ' + contact.lastName + '</description></PersonalAssistantExclusionNumber>';

      var req = {
        method: 'POST',
        url: baseUrl + $rootScope.username + apiName,
        headers: {
          'Accept': 'text/xml',
          'Content-Type': 'text/xml'
        },
        data: xmlParams
      };

      $http(req)
        .success(function(response){
          defer.resolve('VIP added ', contact.number);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();




(function(){
  'use strict';

  ucone.factory('BSSelectiveCallRejection', ['$rootScope', '$http', '$q', '$base64', function($rootScope, $http, $q, $base64){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.remove = function(contact){
      var apiName = '/services/SelectiveCallRejection/criteria/';
      var defer = $q.defer();

      var name = contact.name || contact.firstName + ' ' + contact.lastName;

      $http.delete(baseUrl + $rootScope.username + apiName + name)
        .success(function(response){
          defer.resolve('Deleted, ', name);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.addBlockedNumber = function(contact){
      var defer = $q.defer();

      service.remove(contact).then(function(results){
        console.log(results);
        var apiName = '/services/SelectiveCallRejection/Criteria';
        var allowPrivate = contact.private || false;
        var allowAnonymous = contact.anonymous || false;

        //TODO just don't pass anything in
        if(contact.number === '0001'){
          contact.number = '';
        }

        var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><SelectiveCallRejectionCriteria xmlns="http://schema.broadsoft.com/xsi"><blackListed>false</blackListed><criteria><criteriaName>' + contact.firstName + ' ' + contact.lastName +'</criteriaName><criteriaFromDn><fromDnCriteriaSelection>Specified Only</fromDnCriteriaSelection><includeAnonymousCallers>' + allowPrivate + '</includeAnonymousCallers><includeUnavailableCallers>' + allowAnonymous + '</includeUnavailableCallers><phoneNumberList><phoneNumber>' + contact.number + '</phoneNumber></phoneNumberList></criteriaFromDn><criteriaCallToNumber><callToNumber><type>Primary</type></callToNumber></criteriaCallToNumber></criteria></SelectiveCallRejectionCriteria>';
        var req = {
          method: 'POST',
          url: baseUrl + $rootScope.username + apiName,
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml'
          },
          data: xmlParams
        };

        $http(req)
          .success(function(response){
            defer.resolve('', contact.number);
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });
      });
      return defer.promise;
    };

    service.getAllCallRejectionUrls = function(){
      var apiName = '/services/SelectiveCallRejection';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){

          var newList;

          if(!response.SelectiveCallRejection.criteriaActivations.criteriaActivation){
            defer.resolve([]);
          }
          else{
            if(response.SelectiveCallRejection.criteriaActivations.criteriaActivation.constructor === Array){
              newList = response.SelectiveCallRejection.criteriaActivations.criteriaActivation;
            }
            else{
              newList = [response.SelectiveCallRejection.criteriaActivations.criteriaActivation];
            }

            var urls = [];
            _.each(newList, function(item){
              urls.push({url: item.uri.$});
            });

            defer.resolve(urls);
          }
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.get = function(){
      var defer = $q.defer();

      service.getAllCallRejectionUrls().then(function(urls){
        var contacts = [], promises = [];

        _.each(urls, function(url){
          promises.push($http.get($rootScope.xsp + '/com.broadsoft.xsi-actions' + url.url));
        });

        $q.all(promises).then(function(results){
          _.each(results, function(response){
            var base = response.data.SelectiveCallRejectionCriteria.criteria;
            //if(name !== 'PrivateCalls' && name !== 'AnonymousCalls'){
              contacts.push({name: base.criteriaName.$, number: base.criteriaFromDn.phoneNumberList.phoneNumber.$, privateCalls: base.criteriaFromDn.includeUnavailableCallers.$, anonymousCalls: base.criteriaFromDn.includeAnonymousCallers.$});
           // }
          });
          
          defer.resolve(contacts);
        });
      });

      return defer.promise;
    };

    return service;
  }]);
})();




(function(){
  'use strict';

  ucone.factory('BSSip', ['$rootScope', '$http', '$q', '$base64', function($rootScope, $http, $q, $base64){
    var service = {};
    var chromePhoneDeviceType = 'Chrome-Phone';
    var configUrl = $rootScope.xsp + ':443/dms/chrome-phone/config.json';

    service.getChromeDevice = function(){
      var defer = $q.defer();
      var apiName = '/profile/device';

      chrome.storage.local.get(function(storage){
        $http.get($rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $rootScope.username + apiName)
          .success(function(response){
            _.each(response.AccessDevices.accessDevice, function(device){
              var deviceType = (typeof device.deviceType !== 'undefined') ? device.deviceType.$ : '';

              if(deviceType === chromePhoneDeviceType){
                defer.resolve(device);
              }
            });
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });
      });

      return defer.promise;
    };

    service.getSIPConfig = function(){
      var defer = $q.defer();

      service.getChromeDevice().then(function(device){
        if(typeof device.deviceUserNamePassword === 'undefined'){
          defer.reject('This device does not have a user name or password in the broadworks settings');
        }

        var username = device.deviceUserNamePassword.userName.$;
        var password = device.deviceUserNamePassword.password.$;

        var req = {
          method: 'GET',
          url: configUrl,
          headers: {
            'Authorization': 'Basic ' + $base64.encode(username + ':' + password),
            'Accept': 'text/xml',
            'Content-Type': 'text/xml'
          }
        };

        $http(req)
          .success(function(response){
            defer.resolve(response);
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });
      });

      return defer.promise;
    };

    return service;
  }]);
})();




(function(){
  'use strict';
  ucone.factory('LocalContacts', ['$q', function($q){
    var service = this;

    service.get = function(){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        if(storage.favs){
          defer.resolve(storage.favs);
        }
        else{
          defer.resolve([]);
        }
      });

      return defer.promise;
    };

    service.add = function(contact){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        var favs = [];
        if(storage.favs){
          favs = storage.favs;
        }

        console.log('favs', favs);

        var contactAlreadyExists = _.find(favs, function(obj) {
          console.log(obj.name, contact.name);
          if(contact.name){
            return obj.name == contact.name
          }
          else{
            return obj.firstName + ' ' + obj.lastName == contact.firstName + ' ' + contact.lastName;
          }
        });

        console.log('favs', contactAlreadyExists);


        if(contact.name == 'Unknown' || contact.firstName == 'Unknown'){
          favs.push(contact);
        }
        else{
          if(!contactAlreadyExists){
            favs.push(contact);
          }
        }

        chrome.storage.local.set({favs: favs});

        defer.resolve(storage.favs);
      });

      return defer.promise;
    };

    service.delete = function(index){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        var favs = storage.favs;

        favs.splice(index, 1);

        chrome.storage.local.set({favs: favs});

        defer.resolve(favs);
      });

      return defer.promise;
    };

    return service;
  }]);
})();

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

(function(){
  'use strict';
  ucone.factory('Storage', [function(){
    var service = this;

    service.setValue = function(key, value){
      chrome.storage.local.remove(key);
      var storage = {};
      storage[key] = value;
      chrome.storage.local.set(storage);
    };

    return service;
  }]);
})();

(function(){
  'use strict';
  ucone.factory('Utility', [function(){
    var service = {};

    service.setChromeToMinSize = function(){
      console.log('set the window to min size');
      console.log(chrome.app.window.current().isFullscreen());

      if(chrome.app.window.current().isFullscreen()){
        console.log('in here');
        chrome.app.window.current().restore();
        chrome.app.window.current().fullscreen();
      }

      var monitorWidth = window.screen.availWidth;
      var monitorHeight = window.screen.availHeight;
      var top = Math.round((monitorHeight / 2) - (568 / 2));
      var left = Math.round((monitorWidth / 2) - (400 / 2));

      chrome.app.window.current().innerBounds.maxWidth = 400;
      chrome.app.window.current().innerBounds.maxHeight = 568;
      chrome.app.window.current().innerBounds.minWidth = 400;
      chrome.app.window.current().innerBounds.minHeight = 568;
      chrome.app.window.current().innerBounds.top = top;
      chrome.app.window.current().innerBounds.left = left;
      chrome.app.window.current().innerBounds.width = 400;
      chrome.app.window.current().innerBounds.height = 568;
    };

    service.setChromeToVideoSize = function(){
      console.log('set the window to video size');
      var monitorWidth = window.screen.availWidth;
      var monitorHeight = window.screen.availHeight;
      var videoWidth = Math.round(monitorWidth/2);
      var videoHeight = Math.round(videoWidth * 9 / 16);
      var top = Math.round((monitorHeight / 2) - (videoHeight / 2));
      var left = Math.round((monitorWidth / 2) - (videoWidth / 2));

      chrome.app.window.current().innerBounds.maxWidth = null;
      chrome.app.window.current().innerBounds.maxHeight = null;
      chrome.app.window.current().innerBounds.minWidth = videoWidth;
      chrome.app.window.current().innerBounds.minHeight = videoHeight;
      chrome.app.window.current().innerBounds.top = top;
      chrome.app.window.current().innerBounds.left = left;
      chrome.app.window.current().innerBounds.width = videoWidth;
      chrome.app.window.current().innerBounds.height = videoHeight;
    };

    service.getFirstLetter = function (input) {
      if(input){
        return input.charAt(0);
      }
      else{
        return '?';
      }
    };

    service.getTimesForDropDown = function(){
      var times = [];

      _(96).times(function(n){
        if(n % 4 == 0){times.push(n < 40 ? '0' + Math.floor(n/4) + ':00' : Math.floor(n/4) + ':00');}
        else if(n % 4 == 1){times.push(n < 40 ? '0' + Math.floor(n/4) + ':15' : Math.floor(n/4) + ':15');}
        else if(n % 4 == 2){times.push(n < 40 ? '0' + Math.floor(n/4) + ':30' : Math.floor(n/4) + ':30');}
        else if(n % 4 == 3){times.push(n < 40 ? '0' + Math.floor(n/4) + ':45' : Math.floor(n/4) + ':45');}
      });

      return times;
    };

    service.sanitizeDates = function(date){
      date = date.match(' ') !== null ? date.replace(/\s/g, '-') : date;
      date = date.match('/') !== null ? date.replace(/\//g, '-') : date;

      return date;
    };

    service.getTimeZone = function(){
      var date = new Date();
      if(date.toString().match(/-(....) /) !== null){
        var timeZone = date.toString().match(/-(....)/)[1];
        return timeZone.substr(0,2) + ':' + timeZone.substr(2, 4)
      }
      else{
        return '';
      }
    };

    service.formatDate = function(date, time){
      time = time || '00:00';
      if(!date){
        return '';
      }
      return service.sanitizeDates(date) + 'T' + time +  ':00.000-' + service.getTimeZone();
    };

    service.getBrowserLanguage = function(){
      var language = navigator.language || navigator.userLanguage || 'en-US';
      console.log('Your current language is :', language);
      return language;
    };



    return service;
  }]);
})();

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
      console.log('progressEventFired');
      $rootScope.$broadcast('progressEventFired', event);
    };

    service.failed = function(event){
      console.log('failed event', event);
      if(service.call1.session && event.data.cause !== "Rejected" && event.data.cause !== "Canceled"){
        console.log('found the first session');
        service.call1.session.terminate();
      }
      service.call1 = {session: null, active: false};

      if(service.call2.session && event.data.cause !== "Rejected" && event.data.cause !== "Canceled"){
        console.log('found the second session');
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
      service.call1.progress = false;
      service.call2.progress = false;
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
      var name = '';
      if(service.call1.session){
        name = service.call1.session.remote_identity.display_name;
      }
      else if(service.call2.session){
        name = service.call2.session.remote_identity.display_name;
      }
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
      console.log('accepting', videoEnabled);
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

      $state.go('app.videoCall');
    };

    service.decline = function(){
      console.log('declining call');
      if(service.call1.session){
        console.log('here');
        service.call1.session.terminate();
        service.call1 = {session: null, active: false};
        console.log('here');
      }

      if(service.call2.session){
        console.log('here2');
        service.call2.session.terminate();
        service.call2 = {session: null, active: false};
        console.log('here2');
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

ucone.filter('translator', function($rootScope){
  return function(value){
    if($rootScope.language === null || $rootScope.language === undefined){
      $rootScope.language = 'en-US';
    }

    if(['fr', 'fr-ch', 'fr-mc', 'fr-fr', 'fr-lu', 'fr-ca', 'fr-be'].indexOf($rootScope.language) > -1){
      var frHash = fr.language();
      return frHash[value];
    }
    else if(['es', 'es-ar', 'es-bo', 'es-ci', 'es-co', 'es-cr', 'es-do', 'es-ec', 'es-sv', 'es-gt', 'es-hn', 'es-mx', 'es-ni', 'es-pa', 'es-py', 'es-pe', 'es-pr', 'es-es', 'es-uy', 'es-ve'].indexOf($rootScope.language) > -1){
      var esHash = es.language();
      return esHash[value];
    }
    else if(['de', 'de-at', 'de-de', 'de-li', 'de-lu', 'de-ch'].indexOf($rootScope.language) > -1){
      var germanHash = german.language();
      return germanHash[value];
    }
    else if(['it', 'it-ch'].indexOf($rootScope.language) > -1){
      var italianHash = italian.language();
      return italianHash[value];
    }
    else {
      var enHash = en.language();
      return enHash[value];
    }
  };
});
ucone.filter('truncate', function(){
  return function(value, length, maxLength, apply){
    //value = the string that is passed into the filter
    //length = the length that you want to truncate after on hover
    //maxLength = the length you want to truncate no matter what
    //apply = the switch to activate this control

    if(value.length > length && apply){
      return value.substr(0, length) + '...';
    }
    else if(value.length > maxLength){
      return value.substr(0, maxLength) + '...';
    }
    else{
      return value;
    }
  };
});
var en = new function() {
  this.language = function() {
    return {
      'Login-SignIn': 'Sign In',
      'Login-PleasEnter': 'Please enter your credentials to log in.',
      'Login-XSPPlaceholder': 'Login url',
      'Login-EmailSample': 'user@domain',
      'Login-PasswordSample': 'Password',
      'Login-InvalidError': 'Invalid username or password.',

      'Available': 'Available',
      'BusinessTrip': 'Business Trip',
      'GoneForTheDay': 'Gone For The Day',
      'Lunch': 'Lunch',
      'Meeting': 'Meeting',
      'OutOfOffice': 'Out Of Office',
      'TemporarilyOut': 'Temporarily Out',
      'Training': 'Training',
      'Unavailable': 'Unavailable',
      'Vacation': 'Vacation',

      'SearchExample': 'Type a name or number',
      
      'Favs': 'Favs',
      'Recent': 'Recent',
      'Contacts': 'Contacts',

      'GoogleContacts': 'Google Contacts',
      'TelephoneDirectory': 'Telephone Directory',

      'Incoming': 'Incoming',
      'VIP': 'VIP',
      'Blocked': 'Blocked',

      'Incoming-HeaderMessage': 'Change how your incoming calls are handled',
      'Availability': 'Availability',
      'Until': 'Until',
      'TransferTo': 'Transfer To',
      'ForwardTo': 'ForwardTo',
      'MobileNumber': 'Mobile Number',
      'CallNotifyEmail': 'Call Notify Email',

      'VIP-HeaderMessage': 'Calls from VIPs will ring through regardless of your availability status',
      'AddVIPs': 'AddVIPs',

      'Blocked-HeaderMessage': 'The caller will receive a busy signal and will not be able to leave you voicemail.',
      'BlockPrivateCalls': 'Block Private Calls',
      'BlockAnonymousCalls': 'Block Anonymous Calls',
      'BlockSpecific': 'Block Specific',
      'Callers': 'Callers',

      'CallFrom': 'Call From',
      'Call': 'Call',
      'Calling': 'Calling...',

      'Call1Hold': 'Call 1 (Hold)',
      'Call1Active': 'Call 1 (Active)',
      'Call2Hold': 'Call 2 (Hold)',
      'Call2Active': 'Call 2 (Active)',
      'Join': 'Join',

      'NoFavsYet': 'You have no favs yet.',
      'AddAFavInstructions': 'Click on a contact to add one.',

      'InvalidUserNamePassword': 'Invalid username, password or login url.',
      'WRSNotRegistered': 'WRS is not registered'
    }
  }
};
var es = new function() {
  this.language = function() {
    return {
      'Login-SignIn': '',
      'Login-PleasEnter': '',
      'Login-XSPPlaceholder': '',
      'Login-EmailSample': '',
      'Login-PasswordSample': '',
      'Login-InvalidError': '',

      'Available': '',
      'BusinessTrip': '',
      'GoneForTheDay': '',
      'Lunch': '',
      'Meeting': '',
      'OutOfOffice': '',
      'TemporarilyOut': '',
      'Training': '',
      'Unavailable': '',
      'Vacation': '',

      'SearchExample': '',

      'Favs': '',
      'Recent': '',
      'Contacts': '',

      'GoogleContacts': '',
      'TelephoneDirectory': '',

      'Incoming': '',
      'VIP': '',
      'Blocked': '',

      'Incoming-HeaderMessage': '',
      'Availability': '',
      'Until': '',
      'TransferTo': '',
      'ForwardTo': '',
      'MobileNumber': '',
      'CallNotifyEmail': '',

      'VIP-HeaderMessage': '',
      'AddVIPs': '',

      'Blocked-HeaderMessage': '',
      'BlockPrivateCalls': '',
      'BlockAnonymousCalls': '',
      'BlockSpecific': '',
      'Callers': '',

      'CallFrom': '',
      'Call': '',
      'Calling': '',

      'Call1Hold': '',
      'Call1Active': '',
      'Call2Hold': '',
      'Call2Active': '',
      'Join': '',

      'NoFavsYet': '',
      'AddAFavInstructions': '',

      'InvalidUserNamePassword': ''
    }
  }
};
var fr = new function() {
  this.language = function() {
    return {
      'Login-SignIn': '',
      'Login-PleasEnter': '',
      'Login-XSPPlaceholder': '',
      'Login-EmailSample': '',
      'Login-PasswordSample': '',
      'Login-InvalidError': '',

      'Available': '',
      'BusinessTrip': '',
      'GoneForTheDay': '',
      'Lunch': '',
      'Meeting': '',
      'OutOfOffice': '',
      'TemporarilyOut': '',
      'Training': '',
      'Unavailable': '',
      'Vacation': '',

      'SearchExample': '',

      'Favs': '',
      'Recent': '',
      'Contacts': '',

      'GoogleContacts': '',
      'TelephoneDirectory': '',

      'Incoming': '',
      'VIP': '',
      'Blocked': '',

      'Incoming-HeaderMessage': '',
      'Availability': '',
      'Until': '',
      'TransferTo': '',
      'ForwardTo': '',
      'MobileNumber': '',
      'CallNotifyEmail': '',

      'VIP-HeaderMessage': '',
      'AddVIPs': '',

      'Blocked-HeaderMessage': '',
      'BlockPrivateCalls': '',
      'BlockAnonymousCalls': '',
      'BlockSpecific': '',
      'Callers': '',

      'CallFrom': '',
      'Call': '',
      'Calling': '',

      'Call1Hold': '',
      'Call1Active': '',
      'Call2Hold': '',
      'Call2Active': '',
      'Join': '',

      'NoFavsYet': '',
      'AddAFavInstructions': '',

      'InvalidUserNamePassword': ''
    }
  }
};
var german = new function() {
  this.language = function() {
    return {
      'Login-SignIn': '',
      'Login-PleasEnter': '',
      'Login-XSPPlaceholder': '',
      'Login-EmailSample': '',
      'Login-PasswordSample': '',
      'Login-InvalidError': '',

      'Available': '',
      'BusinessTrip': '',
      'GoneForTheDay': '',
      'Lunch': '',
      'Meeting': '',
      'OutOfOffice': '',
      'TemporarilyOut': '',
      'Training': '',
      'Unavailable': '',
      'Vacation': '',

      'SearchExample': '',

      'Favs': '',
      'Recent': '',
      'Contacts': '',

      'GoogleContacts': '',
      'TelephoneDirectory': '',

      'Incoming': '',
      'VIP': '',
      'Blocked': '',

      'Incoming-HeaderMessage': '',
      'Availability': '',
      'Until': '',
      'TransferTo': '',
      'ForwardTo': '',
      'MobileNumber': '',
      'CallNotifyEmail': '',

      'VIP-HeaderMessage': '',
      'AddVIPs': '',

      'Blocked-HeaderMessage': '',
      'BlockPrivateCalls': '',
      'BlockAnonymousCalls': '',
      'BlockSpecific': '',
      'Callers': '',

      'CallFrom': '',
      'Call': '',
      'Calling': '',

      'Call1Hold': '',
      'Call1Active': '',
      'Call2Hold': '',
      'Call2Active': '',
      'Join': '',

      'NoFavsYet': '',
      'AddAFavInstructions': '',

      'InvalidUserNamePassword': ''
    }
  }
};
var italian = new function() {
  this.language = function() {
    return {
      'Login-SignIn': '',
      'Login-PleasEnter': '',
      'Login-XSPPlaceholder': '',
      'Login-EmailSample': '',
      'Login-PasswordSample': '',
      'Login-InvalidError': '',

      'Available': '',
      'BusinessTrip': '',
      'GoneForTheDay': '',
      'Lunch': '',
      'Meeting': '',
      'OutOfOffice': '',
      'TemporarilyOut': '',
      'Training': '',
      'Unavailable': '',
      'Vacation': '',

      'SearchExample': '',

      'Favs': '',
      'Recent': '',
      'Contacts': '',

      'GoogleContacts': '',
      'TelephoneDirectory': '',

      'Incoming': '',
      'VIP': '',
      'Blocked': '',

      'Incoming-HeaderMessage': '',
      'Availability': '',
      'Until': '',
      'TransferTo': '',
      'ForwardTo': '',
      'MobileNumber': '',
      'CallNotifyEmail': '',

      'VIP-HeaderMessage': '',
      'AddVIPs': '',

      'Blocked-HeaderMessage': '',
      'BlockPrivateCalls': '',
      'BlockAnonymousCalls': '',
      'BlockSpecific': '',
      'Callers': '',

      'CallFrom': '',
      'Call': '',
      'Calling': '',

      'Call1Hold': '',
      'Call1Active': '',
      'Call2Hold': '',
      'Call2Active': '',
      'Join': '',

      'NoFavsYet': '',
      'AddAFavInstructions': '',

      'InvalidUserNamePassword': ''
    }
  }
};