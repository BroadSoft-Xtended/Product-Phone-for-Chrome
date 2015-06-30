(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.main.favs', {

      url: '/favs',

      templateUrl: '/app/states/internal/favs/favs.template.html',

      resolve: {},

      controller: ['$rootScope', '$scope', 'Storage', 'Media', 'BSSip', '$state', function ($rootScope, $scope, Storage, Media, BSSip, $state) {
        console.log('in the favs controller');

        $scope.contacts = [{imageUrl: 'assets/images/sampleFace.png', firstName: 'Lii Ling', lastName: 'Khowo', status: 'away', number: '12405414884'},
          {imageUrl: '', firstName: 'Dummy', lastName: 'User', status: 'offline', number: '99999999'},
          {imageUrl: '', firstName: 'Chris', lastName: 'Kucher', status: 'offline', number: '4104014435'},
          {imageUrl: '', firstName: 'Jonathan', lastName: 'ODonnell', status: 'offline', number: '15062062704'},
          {imageUrl: '', firstName: 'Dominik', lastName: 'Steiner', status: 'offline', number: '12404046584'},
          {imageUrl: 'assets/images/sampleFace.png', firstName: 'Jamie', lastName: 'Palmer', status: 'available', number: '12403645125'}];
      }]
    });
  }]);
})();
