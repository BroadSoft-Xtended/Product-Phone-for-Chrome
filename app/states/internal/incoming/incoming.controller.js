(function(){
  'use strict';

  ucone.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('app.header.settings.incoming', {

      url: '/incoming',

      templateUrl: '/app/states/internal/incoming/incoming.template.html',

      resolve: {},

      controller: ['$scope', 'Utility', 'BSPersonalAssistant', 'BSCallForwardAlways', 'BSCallNotify', 'BSBroadworksAnywhere', function ($scope, Utility, BSPersonalAssistant, BSCallForwardAlways, BSCallNotify, BSBroadworksAnywhere) {
        console.log('in the incoming controller');
        $scope.Utility = Utility;
        $scope.stateList = BSPersonalAssistant.getUserStates();

        BSBroadworksAnywhere.get().then(function(results){
          $scope.mobileNumber = results[0];
          $scope.mobileNumberActive = results[1] == 'true';
        });

        BSPersonalAssistant.getPersonalAssistantData().then(function(results){
          $scope.personalAssistantData = results;
        });

        BSCallForwardAlways.getData().then(function(results){
          $scope.callForwardAlways = results;
        });

        BSCallNotify.getData().then(function(results){
          $scope.callNotifyEmail = results;
        });

        $scope.setPersonalAssistantData = function(){
          var params = {
            presence: $scope.personalAssistantData.presence,
            enableExpirationTime: $scope.personalAssistantData.enableExpirationTime,
            expirationTime: Utility.formatDate($scope.personalAssistantData.expirationDate, $scope.personalAssistantData.expirationTime),
            enableTransferToAttendant: $scope.personalAssistantData.enableTransferToAttendant,
            attendantNumber: $scope.personalAssistantData.attendantNumber,
            ringSplash: 'false'
          };


          BSPersonalAssistant.setPersonalAssistantData(params).then(function(results){
            console.log('data: ', results);
            $scope.personalAssistantData = results;
          })
        };

        $scope.setCallForwardAlways = function(){
          BSCallForwardAlways.setNumber($scope.callForwardAlways, $scope.callForwardAlwaysActive).then(function(results){});
        };

        $scope.setCallNotify = function(){
          BSCallNotify.setCallNotify($scope.callNotifyEmail).then(function(results){
            $scope.callNotifyEmail = results;
          });
        };

        $scope.setBroadworksAnywhere = function(){
          BSBroadworksAnywhere.set($scope.mobileNumber, $scope.mobileNumberActive).then(function(results){
            $scope.moblieNumber = results;
          })
        }
      }]
    });
  }]);
})();
