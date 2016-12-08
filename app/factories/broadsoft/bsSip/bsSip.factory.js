(function() {
  'use strict';

  ucone.factory('BSSip', ['$rootScope', '$http', '$q', '$base64', 'Proxy', function($rootScope, $http, $q, $base64, Proxy) {
    var service = {};
    var chromePhoneDeviceType = 'Chrome-Phone';
    var configUrl = $rootScope.xsp + '/dms/chrome-phone/config.json';

    service.getChromeDevice = function() {
      var defer = $q.defer();
      var apiName = '/profile/device';

      $http.post('/proxy', Proxy.options(apiName))
        .then(function(response) {
          _.each(response.data.AccessDevices.accessDevice, function(device) {
            var deviceType = (typeof device.deviceType !== 'undefined') ? device.deviceType.$ : '';

            if (deviceType === chromePhoneDeviceType) {
              defer.resolve(device);
            }
          });
        }).catch(function(error) {
        console.log(error);
        defer.reject(error);
      });


      return defer.promise;
    };

    service.getSIPConfig = function() {
      var defer = $q.defer();

      service.getChromeDevice().then(function(device) {
        if (typeof device.deviceUserNamePassword === 'undefined') {
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

        $http(req).success(function(response) {
          defer.resolve(response);
        }).error(function(error) {
          console.log(error);
          defer.reject(error);
        });
      });

      return defer.promise;
    };

    return service;
  }]);
})();
