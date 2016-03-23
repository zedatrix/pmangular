/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewcaseCtrl
 * @desc This controls the New Case page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewcaseController', function ($state, $scope, $http, $location, $localStorage, API, Helpers){
        //Assign the list of starting tasks from localStorage to the scope so that we can render it in the view
        $scope.proList = $localStorage.proList;
        $scope.pro_uid = $localStorage.pro_uid;
        /**
         * @author ethan@colosa.com
         * @name startCase
         * @desc Starts a new case in ProcessMaker
         */
        $scope.startCase = function(act_uid){
            //Setting the activity uid to localStorage for later use
            $localStorage.act_uid = act_uid;
            //Set the params for the post request
            API.setParams({pro_uid: $localStorage.pro_uid, tas_uid: $localStorage.act_uid});
            //Make a call to the REST API to start a case
            API.call(function(response){
                //If the length of the data returned from the API is greater than 0, then we know we're in business!
                if( ! angular.isUndefined(response.data.app_uid) && ! angular.isUndefined(response.data.app_number) ){
                    //Set the localStorage application unique identifier to that which was returned from the server
                    $localStorage.app_uid = response.data.app_uid;
                    //Set the localStorage application number to that which was returned from the server
                    $localStorage.app_number = response.data.app_number;
                    //Send the user to the opencase page, there we display the dynaform
                    $state.go('app.opencase');
                }else{
                    return Helpers.showMessageArea('#new-case-area',
                        'There was a problem with your request.', 'danger');
                }
            },
            //Define the request type, in this case, POST
            'POST',
            'cases',
            function(response){
                var message = 'Response code: '+response.status+'.<br />'+
                              'Error message: '+response.data.error.message;
                return Helpers.showMessageArea('#new-case-area',
                 message, 'danger');
            });
        };
});