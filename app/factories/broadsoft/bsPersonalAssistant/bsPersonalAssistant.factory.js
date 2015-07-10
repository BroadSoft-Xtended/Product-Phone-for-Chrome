(function(){
  'use strict';

  ucone.factory('BSPersonalAssistant', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.formatPAData = function(data){
      var presence = (typeof data.presence !== 'undefined') ? data.presence.$ : 'Available';
      var attendantNumber = (typeof data.attendantNumber !== 'undefined') ? data.attendantNumber.$ : '';
      var expirationDate = (typeof data.expirationTime !== 'undefined') ? data.expirationTime.$.split('T')[0] : '';
      var expirationTime = (typeof data.expirationTime !== 'undefined') ? data.expirationTime.$.split('T')[1].substr(0, 5) : '';
      var enableExpirationTime = (typeof data.enableExpirationTime !== 'undefined') ? data.enableExpirationTime.$ === "true" : '';

      return {
        presence: presence,
        attendantNumber: attendantNumber,
        expirationDate: expirationDate,
        expirationTime: expirationTime,
        enableExpirationTime: enableExpirationTime
      }
    };

    service.getPersonalAssistantData = function(){
      var apiName = '/services/personalassistant';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(service.formatPAData(response.PersonalAssistant));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.setPersonalAssistantData = function(params){
        var apiName = '/services/personalassistant';
        var defer = $q.defer();

        params.enableExpirationTime = params.enableExpirationTime ? 'true': 'false';
        params.enableTransferToAttendant = params.enableTransferToAttendant ? 'true': 'false';

        var xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><PersonalAssistant xmlns="http://schema.broadsoft.com/xsi"><presence>'+ params.presence +'</presence><enableExpirationTime>'+ params.enableExpirationTime +'</enableExpirationTime><expirationTime>'+ params.expirationTime +'</expirationTime><enableTransferToAttendant>'+ params.enableTransferToAttendant +'</enableTransferToAttendant><attendantNumber>'+ params.attendantNumber +'</attendantNumber><ringSplash>'+ 'false' +'</ringSplash></PersonalAssistant>';

        console.log('foo', params.expirationTime);

        if(params.enableExpirationTime === 'false'){
          xmlParams = '<?xml version="1.0" encoding="ISO-8859-1"?><PersonalAssistant xmlns="http://schema.broadsoft.com/xsi"><presence>'+ params.presence +'</presence><enableExpirationTime>'+ params.enableExpirationTime +'</enableExpirationTime><enableTransferToAttendant>'+ params.enableTransferToAttendant +'</enableTransferToAttendant><attendantNumber>'+ params.attendantNumber +'</attendantNumber><ringSplash>'+ 'false' +'</ringSplash></PersonalAssistant>';
        }

        console.log(xmlParams);

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
            service.getPersonalAssistantData().then(function(response){
              defer.resolve(response);
            });
          }).error(function(error){
            console.log(error);
            defer.reject(error);
          });

        return defer.promise;
    };

    service.getUserStates = function(){
      return [{value: 'None', text: 'Available'},
      {value: 'Business Trip', text: 'BusinessTrip'},
      {value: 'Gone for the Day', text: 'GoneForTheDay'},
      {value: 'Lunch', text: 'Lunch'},
      {value: 'Meeting', text: 'Meeting'},
      {value: 'Out Of Office', text: 'OutOfOffice'},
      {value: 'Temporarily Out', text: 'TemporarilyOut'},
      {value: 'Training', text: 'Training'},
      {value: 'Unavailable', text: 'Unavailable'},
      {value: 'Vacation', text: 'Vacation'}];
    };

    service.formatExclusionNumberList = function(list){
      var newList;

      if(!list){
        return [];
      }

      if(list.constructor === Array){
         newList = list
      }
      else{
         newList = [list];
      }

      var results = [];
      _.each(newList, function(item){
        console.log('item', item);
        results.push({description: item.description.$, number: item.number.$});
      });

      return results;
    };

    service.getExclusionNumbers = function(){
      var apiName = '/services/personalassistant/exclusionnumberlist';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(service.formatExclusionNumberList(response.PersonalAssistantExclusionNumberList.exclusionNumber));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.deleteExclusionNumber = function(contact){
      var apiName = '/services/personalassistant/exclusionnumber/' + contact.number;
      var defer = $q.defer();

      $http.delete(baseUrl + $rootScope.username + apiName)
        .success(function(response){
          defer.resolve(contact.number + ' deleted');
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.addExclusionNumber = function(contact){
      var apiName = '/services/personalassistant/exclusionnumber';
      var defer = $q.defer();

      var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><PersonalAssistantExclusionNumber xmlns="http://schema.broadsoft.com/xsi"><number>' + contact.number + '</number><description>' + contact.firstName + ' ' + contact.lastName + '</description></PersonalAssistantExclusionNumber>';

      var req = {
        method: 'POST',
        url: baseUrl + $rootScope.username + apiName,
        headers: {
          'Accept': 'text/xml',
          'Content-Type': 'text/xml'
        },
        data: xmlParams
      };

      $http(req)
        .success(function(response){
          defer.resolve('VIP added ', contact.number);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    return service;
  }]);
})();



