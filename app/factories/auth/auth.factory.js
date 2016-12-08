(function(){
  'use strict';

  ucone.factory('Auth', ['$base64', '$rootScope', '$http', 'Storage', '$q', '$cookies', function($base64, $rootScope, $http, Storage, $q, $cookies){
    var service = {};

    service.setCredentials = function (username, password, xsp) {
      $rootScope.xsp = xsp;
      $rootScope.username = username;
      $rootScope.password = password;
    };

    service.setConfig = function(type){
      console.log('type', type);
      var defer = $q.defer();
      var configuration;
      var cookiesConfig = $cookies.getObject('sipConfig');

      configuration = {
        'ws_servers' : [ {
          'ws_uri' : type == 'attemptTwo' ? cookiesConfig.secondaryWrsAddress : cookiesConfig.primaryWrsAddress,
          'weight' : 0
        } ],
        'uri' : cookiesConfig.sipLineport,
        'auth_user': cookiesConfig.sipUsername,
        'authorization_user': cookiesConfig.sipUsername,
        'password': cookiesConfig.sipPassword,
        'stun_servers': type == 'attemptTwo' ? cookiesConfig.secondaryStunServer : cookiesConfig.primaryStunServer,
        'trace_sip' : true,
        'displayName': (_.unescape(cookiesConfig.userFirstName + ' ' + cookiesConfig.userLastName)).replace("&apos;", "'")
      };

      console.log("the user's config: ", configuration);

      $rootScope.userFirstName = cookiesConfig.userFirstName;

      defer.resolve(configuration);
    
      return defer.promise;
    };

    return service;
  }]);
})();
