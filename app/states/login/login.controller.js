(function(){
  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('login', {

      url: '/login',

      templateUrl: '/states/login/login.template.html',
      params: {message: null},
      resolve: {},

      controller: ['$rootScope', '$scope', '$state', '$http', 'Auth', 'Utility', 'Storage', '$cookies', '$base64', 'BSDirectory', function ($rootScope, $scope, $state, $http, Auth, Utility, Storage, $cookies, $base64, BSDirectory) {

        console.log('in the login controller');
        $scope.spinner = false;

        $scope.xsp = 'https://xsp.ihs.broadsoft.com';
        $scope.email = 'jodonnell@broadsoft.com';

        Utility.setChromeToMinSize();

        if($cookies.get('storage.xsp')) {
          $scope.xsp = $cookies.get('storage.xsp');
        }
        if($cookies.get('storage.email')){
          $scope.email = $cookies.get('storage.email');
        }

        $rootScope.language = Utility.getBrowserLanguage();

        if($state.params.message){
          $scope.errorMessage = $state.params.message;
        }

        $scope.rememberLoginUrlAndEmail = function(){
          $cookies.put('storage.xsp', $scope.xsp);
          Storage.setValue('storage.email', $scope.email);
        };

        $scope.broadsoftLogin = function(login){
          $state.go('app.header.main.favs');

          $scope.rememberLoginUrlAndEmail();
          console.log('bsft login');
          login.$pristine = false;
          if(login.$valid){
            Auth.setCredentials($scope.email, $scope.password, $scope.xsp);

            BSDirectory.getDirectoryContacts(1,50).then(function(response){
              $state.go('app.header.main.favs');
            }).catch(function(error){
              $scope.spinner = false;
              console.log('Login Error', error);
              $scope.errorMessage = 'InvalidUserNamePassword';
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
