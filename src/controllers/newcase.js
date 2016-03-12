/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewcaseCtrl
 * @desc This controls the New Case page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewcaseController', function ($state, $scope, $http, $location, $localStorage, API){
        //Assign the list of starting tasks from localStorage to the scope so that we can render it in the view
        $scope.taskList = $localStorage.startingTasks;
        /**
         * @author ethan@colosa.com
         * @name startCase
         * @desc Starts a new case in ProcessMaker
         */
        $scope.startCase = function(act_uid){
            //Setting the activity uid to localStorage for later use
            $localStorage.act_uid = act_uid;
            //Set the requestType
            API.setRequestType('cases');
            //Set the params for the post request
            API.setParams({pro_uid: $localStorage.pro_uid, tas_uid: $localStorage.act_uid});
            //Make a call to the REST API to start a case
            API.call(function(response){
                //If the length of the data returned from the API is greater than 0, then we know we're in business!
                if( $(response.data).size() > 0 ){
                    //Send the user to the opencase page, there we display the dynaform
                    $state.go('app.opencase');
                    //Set the localStorage application unique identifier to that which was returned from the server
                    $localStorage.app_uid = response.data.app_uid;
                    //Set the localStorage application number to that which was returned from the server
                    $localStorage.app_number = response.data.app_number;
                }
            },
            //Define the request type, in this case, POST
            'POST');
        };
});