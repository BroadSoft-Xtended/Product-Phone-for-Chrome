(function(){
  'use strict';

  ucone.factory('BSCallNotify', ['$rootScope', '$http', '$q', 'Proxy', function($rootScope, $http, $q, Proxy){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.getData = function(){
      var apiName = '/services/callnotify/?';
      var defer = $q.defer();

      $http.post('/proxy', Proxy.options(apiName))
        .success(function(response){
          var email = (typeof response.CallNotify.callNotifyEmailAddress !== 'undefined') ? response.CallNotify.callNotifyEmailAddress : '';
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

