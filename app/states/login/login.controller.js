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

        //TODO REMOVE
        $scope.email = 'jodonnell@broadsoft.com';
        $scope.password = window.password;
        $scope.xsp = 'https://xsp1.ihs.broadsoft.com';

        if($state.params.message){
          $scope.errorMessage = $state.params.message;
        }

        $scope.googleAuth = function(){
          chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
            console.log(token);

            //Params
            //?access_token=' + token + '&alt=json&max-results=99999999&v=3

            //You need the v=3

            //Get all contacts
            //https://www.google.com/m8/feeds/contacts/default/full?access_token=ya29.eQGYWn4TXMdxSRWoWdKit8aQmI9gR3264msmZu2uH80-T55oJtD8t8yflbnnEAxCH3PSVhOYwb8BVA&alt=json&v=3

            //Get all the contacts
            //https://www.google.com/m8/feeds/groups/default/full

            //Get the my contacts group
            //https://www.google.com/m8/feeds/groups/default/base/6?access_token=ya29.eQGYWn4TXMdxSRWoWdKit8aQmI9gR3264msmZu2uH80-T55oJtD8t8yflbnnEAxCH3PSVhOYwb8BVA&alt=json&v=3

            //Get all the groups
            //https://www.google.com/m8/feeds/groups/default/full?access_token=ya29.eQGYWn4TXMdxSRWoWdKit8aQmI9gR3264msmZu2uH80-T55oJtD8t8yflbnnEAxCH3PSVhOYwb8BVA&alt=json&v=3

            $http.get('https://www.google.com/m8/feeds/groups/default/full?access_token=' + token + '&alt=json&v=3').success(function(response){
              window.jrespones = response;
            }).error(function(data, errorCode){
              console.log('error', data);
              console.log(errorCode);
            });
          });
        };

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
        }
      }]
    });
  }]);
})();
