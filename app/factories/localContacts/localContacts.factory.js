(function(){
  'use strict';
  ucone.factory('LocalContacts', ['$q', '$cookies', function($q, $cookies){
    var service = this;

    service.get = function(){
      var defer = $q.defer();


      if($cookies.get('storage.favs')){
        defer.resolve($cookies.get('storage.favs'));
      }
      else{
        defer.resolve([]);
      }


      return defer.promise;
    };

    service.add = function(contact){
      var defer = $q.defer();

      var favs = [];
      if($cookies.getObject('storage.favs')){
        favs = $cookies.getObject('storage.favs');
      }

      console.log('favs', favs);

      var contactAlreadyExists = _.find(favs, function(obj) {
        console.log(obj.name, contact.name);
        if(contact.name){
          return obj.name == contact.name
        }
        else{
          return obj.firstName + ' ' + obj.lastName == contact.firstName + ' ' + contact.lastName;
        }
      });

      console.log('favs', contactAlreadyExists);


      if(contact.name == 'Unknown' || contact.firstName == 'Unknown'){
        favs.push(contact);
      }
      else{
        if(!contactAlreadyExists){
          favs.push(contact);
        }
      }

      $cookies.putObject('storage.favs', favs);

      defer.resolve(storage.favs);


      return defer.promise;
    };

    service.delete = function(index){
      var defer = $q.defer();


      var favs = $cookies.getObject('storage.favs');

      favs.splice(index, 1);

      $cookies.putObject('storage.favs', favs);

      defer.resolve(favs);

      return defer.promise;
    };

    return service;
  }]);
})();
