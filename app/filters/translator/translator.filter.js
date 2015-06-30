ucone.filter('translator', function($rootScope){
  return function(value){
    if($rootScope.language === null || $rootScope.language === undefined){
      $rootScope.language = 'en-US';
    }

    if(['fr', 'fr-ch', 'fr-mc', 'fr-fr', 'fr-lu', 'fr-ca', 'fr-be'].indexOf($rootScope.language) > -1){
      var frHash = fr.language();
      return frHash[value];
    }
    else if(['es', 'es-ar', 'es-bo', 'es-ci', 'es-co', 'es-cr', 'es-do', 'es-ec', 'es-sv', 'es-gt', 'es-hn', 'es-mx', 'es-ni', 'es-pa', 'es-py', 'es-pe', 'es-pr', 'es-es', 'es-uy', 'es-ve'].indexOf($rootScope.language) > -1){
      var esHash = es.language();
      return esHash[value];
    }
    else if(['de', 'de-at', 'de-de', 'de-li', 'de-lu', 'de-ch'].indexOf($rootScope.language) > -1){
      var germanHash = german.language();
      return germanHash[value];
    }
    else if(['it', 'it-ch'].indexOf($rootScope.language) > -1){
      var italianHash = italian.language();
      return italianHash[value];
    }
    else {
      var enHash = en.language();
      return enHash[value];
    }
  };
});