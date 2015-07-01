(function(){
  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('login', {

      url: '/login',

      templateUrl: '/app/states/login/login.template.html',
      params: {message: null},
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', '$http', 'Auth', 'Utility', function ($rootScope, $scope, $state, $http, Auth, Utility) {
        console.log('in the login controller');

        Utility.setChromeToMinSize();

        $rootScope.language = Utility.getBrowserLanguage();

        if($state.params.message){
          $scope.errorMessage = $state.params.message;
        }

        $scope.broadsoftLogin = function(login){
          console.log('bsft login');
          login.$pristine = false;
          if(login.$valid){
            Auth.setCredentials($scope.email, $scope.password, $scope.xsp);

            $http.get($rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $scope.email + '/directories/Enterprise').success(function(response){
              $state.go('app.header.main.favs');
            }).error(function(error){
              console.log(error);
              login.$valid = false;
            });
          }
          else{
            $scope.errorMessage = 'Invalid username or password.'
          }
        };

      }]
    });
  }]);
})();
