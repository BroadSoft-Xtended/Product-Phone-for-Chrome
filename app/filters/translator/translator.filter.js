ucone.filter('translator', function($rootScope){
  return function(value){
    if($rootScope.language === null || $rootScope.language === undefined){
      $rootScope.language = 'en';
    }

    var keys = value.split('.');

    if($rootScope.language == 'en'){
      var enHash = en.language();
      return enHash[keys[0]][keys[1]];
    } else {
      var frHash = fr.language();
      return frHash[keys[0]][keys[1]];
    }
  };
});