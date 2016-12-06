(function(){
  'use strict';

  ucone.factory('BSConference', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    service.start = function () {
      var callIds = [];
      var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $rootScope.username + '/calls/Conference';

      $http.get('https://xsp1.ihs.broadsoft.com/com.broadsoft.xsi-actions/v2.0/user/jodonnell@broadsoft.com/calls')
        .success(function(results){
          _.each(results.Calls.call, function(call){
            callIds.push({uri: call.uri.$, callId: call.callId.$});
          });

          var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><Conference xmlns="http://schema.broadsoft.com/xsi"><conferenceParticipantList><conferenceParticipant><callId>' + callIds[0].callId + '</callId></conferenceParticipant><conferenceParticipant><callId>' + callIds[1].callId + '</callId></conferenceParticipant></conferenceParticipantList></Conference>';

          var req = {
            method: 'POST',
            url: baseUrl,
            headers: {
              'Accept': 'text/xml',
              'Content-Type': 'text/xml'
            },
            data: xmlParams
          };

          $http(req)
            .success(function(response){
              console.log('Conference Started ', callIds);
            }).error(function(error){
              console.log(error);
            });

        }).error(function(error){
          console.log('did not get the calls: ', error);
        });
    };

    return service;
  }]);
})();

