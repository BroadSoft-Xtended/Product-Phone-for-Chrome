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
            'ws_uri' : 'wss://wrs3.ihs.broadsoft.com:8060',
            'weight' : 0
          } ],
          'uri' : storage.sipConfig.sipLineport,
          'auth_user': storage.sipConfig.sipUsername,
          'authorization_user': storage.sipConfig.sipUsername,
          'password': storage.sipConfig.sipPassword,
          'stun_servers': '64.212.220.82:3478',
          'trace_sip' : true,
          'displayName': (_.unescape(storage.sipConfig.userFirstName + ' ' + storage.sipConfig.userLastName)).replace("&apos;", "'")
        };

        $rootScope.userFirstName = storage.sipConfig.userFirstName;

        defer.resolve(configuration);
      });

      return defer.promise;
    };

    return service;
  }]);
})();

