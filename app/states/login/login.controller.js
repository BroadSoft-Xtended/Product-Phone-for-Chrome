(function(){
  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('login', {

      url: '/login',

      templateUrl: '/app/states/login/login.template.html',
      params: {message: null},
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', '$http', 'Auth', 'Utility', 'Storage', function ($rootScope, $scope, $state, $http, Auth, Utility, Storage) {
        console.log('in the login controller');
        $scope.spinner = false;

        Utility.setChromeToMinSize();

        chrome.storage.local.get(function(storage){
          if(storage.LoginUrl){
            $scope.xsp = storage.LoginUrl
          }
          if(storage.LoginEmail){
            $scope.email = storage.LoginEmail
          }
          $scope.$apply();
        });

        $rootScope.language = Utility.getBrowserLanguage();

        if($state.params.message){
          $scope.errorMessage = $state.params.message;
        }

        $scope.rememberLoginUrlAndEmail = function(){
          Storage.setValue('LoginUrl', $scope.xsp);
          Storage.setValue('LoginEmail', $scope.email);
        };

        $scope.broadsoftLogin = function(login){
          $scope.rememberLoginUrlAndEmail();
          console.log('bsft login');
          login.$pristine = false;
          if(login.$valid){
            Auth.setCredentials($scope.email, $scope.password, $scope.xsp);

            $http.get($rootScope.xsp + '/com.broadsoft.xsi-actions/v2.0/user/' + $scope.email + '/directories/Enterprise').success(function(response){
              $state.go('app.header.main.favs');
            }).error(function(error){
              $scope.spinner = false;
              console.log('Login Error', error);
              $scope.errorMessage = 'InvalidUserNamePassword'
              login.$valid = false;
            });
          }
          else{
            $scope.spinner = false;
            $scope.errorMessage = 'InvalidUserNamePassword'
          }
        };

      }]
    });
  }]);
})();
