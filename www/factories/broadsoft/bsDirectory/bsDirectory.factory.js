(function(){
  'use strict';

  ucone.factory('BSDirectory', ['$rootScope', '$http', '$q', function($rootScope, $http, $q){
    var service = {};

    var baseUrl = $rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/';

    service.initBroadsoftContacts = function (BSFTContacts) {
      var allContacts = [];
      if(BSFTContacts.constructor === Array){
        allContacts = BSFTContacts;
      }
      else{
        allContacts = [BSFTContacts];
      }

      var contacts = [];
      _.each(allContacts, function(contact){
        var firstName = contact.firstName ? contact.firstName.$ : '';
        var lastName = contact.lastName ? contact.lastName.$ : '';
        var number = contact.number ? contact.number.$ : '';
        var id = contact.userId ? contact.userId.$ : '';
        var mobileNumber = contact.additionalDetails ? contact.additionalDetails.mobile ? contact.additionalDetails.mobile.$ : '' : '';

        contacts.push({firstName: firstName, lastName: lastName, number: number, id: id, mobileNumber: mobileNumber});
      });

      return contacts;
    };

    service.getDirectoryContacts = function (pageStart, pageSize) {
      var apiName = '/directories/Enterprise?';
      var defer = $q.defer();

      $http.get(baseUrl + $rootScope.username + apiName + 'start=' + pageStart + '&results=' + pageSize)
        .success(function(response){
          defer.resolve(service.initBroadsoftContacts(response.Enterprise.enterpriseDirectory.directoryDetails));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };

    service.searchDirectoryContacts = function(searchText, pageStart, pageSize){
      var apiName = '/directories/Enterprise?';
      var defer = $q.defer();
      var lastName, firstName, searchWithOr;

      if(!searchText){
        defer.resolve([]);
        return defer.promise;
      }

      if(searchText.indexOf(' ') > -1){
        firstName = searchText.split(' ')[0];
        lastName = searchText.split(' ')[1];
        searchWithOr = false;
      }
      else{
        firstName = searchText;
        lastName = searchText;
        searchWithOr = true;
      }

      $http.get(baseUrl + $rootScope.username + apiName + 'searchCriteriaModeOr=' + searchWithOr + '&firstName=*' + firstName + '*/i&lastName=*' + lastName + '*/i&start=' + pageStart +'&results=' + pageSize)
        .success(function(response){
          defer.resolve(service.initBroadsoftContacts(response.Enterprise.enterpriseDirectory.directoryDetails));
        }).error(function(error){
          console.log(error);
          defer.reject(error);
        });

      return defer.promise;
    };



    return service;
  }]);
})();
