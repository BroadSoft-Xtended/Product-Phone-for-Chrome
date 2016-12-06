(function(){
  'use strict';

  ucone.factory('Auth', ['$base64', '$rootScope', '$http', 'Storage', '$q', '$cookies', function($base64, $rootScope, $http, Storage, $q, $cookies){
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

    service.setConfig = function(type){
      console.log('type', type);
      var defer = $q.defer();
      var configuration;

      configuration = {
        'ws_servers' : [ {
          'ws_uri' : type == 'attemptTwo' ? $cookies.get('storage.sipConfig.secondaryWrsAddress') : $cookies.get('storage.sipConfig.primaryWrsAddress'),
          'weight' : 0
        } ],
        'uri' : $cookies.get('storage.sipConfig.sipLineport'),
        'auth_user': $cookies.get('storage.sipConfig.sipUsername'),
        'authorization_user': $cookies.get('storage.sipConfig.sipUsername'),
        'password': $cookies.get('storage.sipConfig.sipPassword'),
        'stun_servers': type == 'attemptTwo' ? $cookies.get('storage.sipConfig.secondaryStunServer') : $cookies.get('storage.sipConfig.primaryStunServer'),
        'trace_sip' : true,
        'displayName': (_.unescape($cookies.get('storage.sipConfig.userFirstName') + ' ' + $cookies.get('storage.sipConfig.userLastName'))).replace("&apos;", "'")
      };

      console.log("the user's config: ", configuration);

      $rootScope.userFirstName = $cookies.get('storage.sipConfig.userFirstName');

      defer.resolve(configuration);
    
      return defer.promise;
    };

    return service;
  }]);
})();