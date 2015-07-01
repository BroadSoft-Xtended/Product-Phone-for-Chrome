(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.favs', {

      url: '/favs',

      templateUrl: '/app/states/internal/favs/favs.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'LocalContacts', '$http', function ($rootScope, $scope, LocalContacts, $http) {
        console.log('in the favs controller');
        $scope.foo = {};

        $scope.removeFav = function(index){
          $scope.foo = {};

          LocalContacts.delete(index).then(function(contacts){
            console.log('removed');
            console.log(contacts);
            $scope.contacts = contacts;
          });
        };

        LocalContacts.get().then(function(contacts){
          $scope.contacts = contacts;
          console.log('con', contacts);
        });
      }]
    });
  }]);
})();
