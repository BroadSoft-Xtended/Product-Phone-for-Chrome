(function() {
  'use strict';

  ucone.directive('contactActions', function(Media, LocalContacts, $rootScope){
    return {
      scope: {
        contact: '=',
        deleteMode: '=',
        show: '='
      },
      templateUrl: '/app/directives/contactActions/contactActions.template.html',
      link: function(scope, element, attrs){
        scope.media = Media;

        scope.addToFavs = function(contact){
          console.log('add');
          LocalContacts.add(contact).then(function(){
            scope.openPopup = false;
            $rootScope.$broadcast('favsChanged');
          });
        };

        scope.removeFav = function(index){
          console.log('remove');
          LocalContacts.delete(index).then(function(contacts){
            $rootScope.$broadcast('favsChanged');
          });
        };
      }
    }
  });
})();

