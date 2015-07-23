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
          var active = (typeof response.CallForwardingAlways.active !== 'undefined') ? response.CallForwardingAlways.active.$ : '';
          var activeBool = active == 'true';
          defer.resolve([number, activeBool]);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.setNumber = function(number, active){
      var apiName = '/services/CallForwardingAlways?';
      var defer = $q.defer();

      console.log(number);
      console.log(active);

      number = number || '';

      var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><CallForwardingAlways xmlns="http://schema.broadsoft.com/xsi"><active>' + active + '</active><forwardToPhoneNumber>' + number + '</forwardToPhoneNumber><ringSplash>' + 'false' + '</ringSplash></CallForwardingAlways>';
      if(number === ''){ xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><CallForwardingAlways xmlns="http://schema.broadsoft.com/xsi"><active>' + active + '</active><ringSplash>' + 'false' + '</ringSplash></CallForwardingAlways>';}

      console.log('xml Params', xmlParams);

      var req = {
        method: 'PUT',
        url: baseUrl + $rootScope.username + apiName,
        headers: {'Accept': 'text/xml','Content-Type': 'text/xml'},
        data: xmlParams
      };

      $http(req)
        .success(function(){
          defer.resolve([number, active]);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();

