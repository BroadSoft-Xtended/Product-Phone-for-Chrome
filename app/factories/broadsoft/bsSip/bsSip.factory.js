(function() {
  'use strict';

  ucone.factory('BSSip', ['$rootScope', '$http', '$q', '$base64', 'Proxy', '$cookies', function($rootScope, $http, $q, $base64, Proxy, $cookies) {
    var service = {};
    var chromePhoneDeviceType = 'Chrome-Phone';

    service.getChromeDevice = function() {
      var defer = $q.defer();
      var apiName = '/profile/device';



      $http.post('/proxy', Proxy.options(apiName))
        .then(function(response) {
          _.each(response.data.AccessDevices.accessDevice, function(device) {
            console.log('device', device);
            var deviceType = (typeof device.deviceType !== 'undefined') ? device.deviceType : '';

            if (deviceType === chromePhoneDeviceType) {
              defer.resolve(device);
            }
          });
        })
        .catch(function(error) {
          console.error(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.getSIPConfig = function() {
      console.log('get Sip config');
      var configUrl = $rootScope.xsp + '/dms/chrome-phone/config.json';

      var defer = $q.defer();

      service.getChromeDevice().then(function(device) {
        if (typeof device.deviceUserNamePassword === 'undefined') {
          defer.reject('This device does not have a user name or password in the broadworks settings');
        }

        var username = device.deviceUserNamePassword.userName;
        var password = device.deviceUserNamePassword.password;

        // var req = {
        //   method: 'GET',
        //   url: configUrl,
        //   headers: {
        //     'Authorization': 'Basic ' + $base64.encode(username + ':' + password),
        //     'Accept': 'text/xml',
        //     'Content-Type': 'text/xml'
        //   }
        // };

        var options = Proxy.options('');
        options.url = $rootScope.xsp + '/dms/chrome-phone/config.json';
        options.username = username;
        options.password = password;

        $http.post('/proxy', options).success(function(response) {
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
