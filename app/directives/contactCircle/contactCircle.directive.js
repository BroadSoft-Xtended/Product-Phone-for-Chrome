(function() {
  'use strict';

  ucone.directive('contactCircle', function(Utility){
    return {
      scope: {
        contact: '='
      },
      templateUrl: '/directives/contactCircle/contactCircle.template.html',
      link: function(scope, element, attrs){
        scope.getContactLetter = function(contact){
          return Utility.getFirstLetter(contact.firstName || contact.name || contact.description);
        }
      }
    }
  });
})();

