(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.favs', {

      url: '/favs',

      templateUrl: '/app/states/internal/favs/favs.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'LocalContacts', 'Utility', '$timeout', function ($rootScope, $scope, LocalContacts, Utility, $timeout) {
        console.log('in the favs controller');

        //$timeout(function(){
        //  Utility.setChromeToMinSize();
        //});


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
