(function(){
  'use strict';

  ucone.factory('BSBroadworksAnywhere', ['$rootScope', '$http', '$q', 'Proxy', function($rootScope, $http, $q, Proxy){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.set = function (phoneNumber, active) {
      var defer = $q.defer();

      service.get().then(function(oldNumber){
        var apiName = '/services/BroadworksAnywhere/Location/' + oldNumber[0];

        var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
          '<BroadWorksAnywhereLocation xmlns="http://schema.broadsoft.com/xsi">'+
          '<phoneNumber>' + phoneNumber + '</phoneNumber>' +
          '<description>My Phone</description>' +
          '<active>' + active + '</active>' +
          '<broadworksCallControl>false</broadworksCallControl>' +
          '<useDiversionInhibitor>false</useDiversionInhibitor>' +
          '<answerConfirmationRequired>false</answerConfirmationRequired>' +
          '</BroadWorksAnywhereLocation>';

        var req = {
          method: 'PUT',
          url: baseUrl + $rootScope.username + apiName,
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml'
          },
          data: xmlParams
        };

        console.log('foo', req);

        $http(req)
          .success(function(response){
            console.log('BSBroadworksAnywhere SET', response);
            defer.resolve(phoneNumber);
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });
      });

      return defer.promise;
    };

    service.get = function () {
      var apiName = '/services/BroadworksAnywhere';
      var defer = $q.defer();

      $http.post('/proxy', Proxy.options(apiName))
        .success(function(response){
          console.log('BSBroadworksAnywhere Get: ', response);
          if(!response.BroadWorksAnywhere.locations){
            defer.resolve('');
          }
          defer.resolve([response.BroadWorksAnywhere.locations.location.phoneNumber.$, response.BroadWorksAnywhere.locations.location.active.$]);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();

