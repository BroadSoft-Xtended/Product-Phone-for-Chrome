(function(){
  'use strict';

  ucone.factory('Proxy', ['$rootScope', '$cookies', function($rootScope, $cookies){
    var service = {};

    service.options = function (apiRoute) {
      var xsp = $rootScope.xsp || $cookies.get('storage.xsp');
      console.log('proxy xsp:', xsp);
      return {
        url: xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $rootScope.username + apiRoute,
        username: $rootScope.username,
        password: $rootScope.password
      }
    };

    return service;
  }]);
})();
