(function(){
  'use strict';
  ucone.factory('Storage', [function(){
    var service = this;

    service.setValue = function(key, value){
      chrome.storage.local.remove(key);
      var storage = {};
      storage[key] = value;
      chrome.storage.local.set(storage);
    };

    return service;
  }]);
})();
