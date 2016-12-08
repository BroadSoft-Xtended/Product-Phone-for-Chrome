(function(){
  'use strict';
  ucone.factory('Storage', ['$cookies', function($cookies){
    var service = this;

    service.setValue = function(key, value){
      $cookies.remove(key);
      $cookies.put(key, value);
    };

    return service;
  }]);
})();
