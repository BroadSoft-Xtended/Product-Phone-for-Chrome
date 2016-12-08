(function(){
  'use strict';

  ucone.factory('BSSelectiveCallRejection', ['$rootScope', '$http', '$q', '$base64', 'Proxy', function($rootScope, $http, $q, $base64, Proxy){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.remove = function(contact){
      var apiName = '/services/SelectiveCallRejection/criteria/';
      var defer = $q.defer();

      var name = contact.name || contact.firstName + ' ' + contact.lastName;

      $http.delete(baseUrl + $rootScope.username + apiName + name)
        .success(function(response){
          defer.resolve('Deleted, ', name);
        }).error(function(error){
        console.log(error);
        defer.reject(error);
      });

      return defer.promise;
    };

    service.addBlockedNumber = function(contact){
      var defer = $q.defer();

      service.remove(contact).then(function(results){
        console.log(results);
        var apiName = '/services/SelectiveCallRejection/Criteria';
        var allowPrivate = contact.private || false;
        var allowAnonymous = contact.anonymous || false;

        //TODO just don't pass anything in
        if(contact.number === '0001'){
          contact.number = '';
        }

        var xmlParams = '<?xml version="1.0" encoding="UTF-8"?><SelectiveCallRejectionCriteria xmlns="http://schema.broadsoft.com/xsi"><blackListed>false</blackListed><criteria><criteriaName>' + contact.firstName + ' ' + contact.lastName +'</criteriaName><criteriaFromDn><fromDnCriteriaSelection>Specified Only</fromDnCriteriaSelection><includeAnonymousCallers>' + allowPrivate + '</includeAnonymousCallers><includeUnavailableCallers>' + allowAnonymous + '</includeUnavailableCallers><phoneNumberList><phoneNumber>' + contact.number + '</phoneNumber></phoneNumberList></criteriaFromDn><criteriaCallToNumber><callToNumber><type>Primary</type></callToNumber></criteriaCallToNumber></criteria></SelectiveCallRejectionCriteria>';
        var req = {
          method: 'POST',
          url: baseUrl + $rootScope.username + apiName,
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml'
          },
          data: xmlParams
        };

        $http(req).success(function(response){
          defer.resolve('', contact.number);
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });
      });
      return defer.promise;
    };

    service.getAllCallRejectionUrls = function(){
      var apiName = '/services/SelectiveCallRejection';
      var defer = $q.defer();

      $http.post('/proxy', Proxy.options(apiName))
        .success(function(response){

          var newList;

          if(!response.SelectiveCallRejection.criteriaActivations.criteriaActivation){
            defer.resolve([]);
          }
          else{
            if(response.SelectiveCallRejection.criteriaActivations.criteriaActivation.constructor === Array){
              newList = response.SelectiveCallRejection.criteriaActivations.criteriaActivation;
            }
            else{
              newList = [response.SelectiveCallRejection.criteriaActivations.criteriaActivation];
            }

            var urls = [];
            _.each(newList, function(item){
              urls.push({url: item.uri.$});
            });

            defer.resolve(urls);
          }
        }).error(function(error){
        console.log(error);
        defer.reject(error);
      });

      return defer.promise;
    };

    service.get = function(){
      var defer = $q.defer();

      service.getAllCallRejectionUrls().then(function(urls){
        var contacts = [], promises = [];

        _.each(urls, function(url){
          promises.push($http.get($rootScope.xsp + '/com.broadsoft.xsi-actions' + url.url));
        });

        $q.all(promises).then(function(results){
          _.each(results, function(response){
            var base = response.data.SelectiveCallRejectionCriteria.criteria;
            //if(name !== 'PrivateCalls' && name !== 'AnonymousCalls'){
            contacts.push({name: base.criteriaName.$, number: base.criteriaFromDn.phoneNumberList.phoneNumber.$, privateCalls: base.criteriaFromDn.includeUnavailableCallers.$, anonymousCalls: base.criteriaFromDn.includeAnonymousCallers.$});
            // }
          });

          defer.resolve(contacts);
        });
      });

      return defer.promise;
    };

    return service;
  }]);
})();



