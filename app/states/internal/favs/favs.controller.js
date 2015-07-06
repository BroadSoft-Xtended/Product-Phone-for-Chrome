(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.favs', {

      url: '/favs',

      templateUrl: '/app/states/internal/favs/favs.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'LocalContacts', '$http', function ($rootScope, $scope, LocalContacts, $http) {
        console.log('in the favs controller');

        LocalContacts.get().then(function(contacts){
          $scope.contacts = contacts;
          console.log('fav contacts: ', contacts);
        });

        $rootScope.$on('favsChanged', function(){
          LocalContacts.get().then(function(contacts){
            $scope.contacts = contacts;
            console.log('fav contacts: ', contacts);
          });
        })
      }]
    });
  }]);
})();
