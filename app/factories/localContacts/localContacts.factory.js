(function(){
  'use strict';
  ucone.factory('LocalContacts', ['$q', function($q){
    var service = this;

    service.get = function(){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        if(storage.favs){
          defer.resolve(storage.favs);
        }
        else{
          defer.resolve([]);
        }
      });

      return defer.promise;
    };

    service.add = function(contact){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        var favs = [];
        if(storage.favs){
          favs = storage.favs;
        }

        var contactAlreadyExists = _.find(favs, function(obj) { return obj.name == contact.name });

        if(contact.name == 'Unknown' || contact.firstName == 'Unknown'){
          favs.push(contact);
        }
        else{
          if(!contactAlreadyExists){
            favs.push(contact);
          }
        }

        chrome.storage.local.set({favs: favs});

        defer.resolve(storage.favs);
      });

      return defer.promise;
    };

    service.delete = function(index){
      var defer = $q.defer();

      chrome.storage.local.get(function(storage){
        var favs = storage.favs;

        favs.splice(index, 1);

        chrome.storage.local.set({favs: favs});

        defer.resolve(favs);
      });

      return defer.promise;
    };

    return service;
  }]);
})();
