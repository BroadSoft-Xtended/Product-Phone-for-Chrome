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

