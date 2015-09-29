/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewprocessCtrl
 * @desc This controls the New Process Page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewprocessController', function ($rootScope, $scope, $http, $location, $localStorage, API){
        $scope.getProcessList = function(){
            //Set the requestType
            API.setRequestType('project');
            //Make the API call to get the list of available processes
            API.call(function(response){
                //Assign the data received from the API to the scope so that we
                //Can render the template with the data
                $scope.proList = response.data;
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if($scope.proList.length===0){
                    //#new-process-area is the area on the page we are rendering
                    //The list of processes, so we are setting it's HTML equal to the display message
                    $('#new-process-area').html('$$NoProcessesToDisplayMessage$$');
                }
                });
        }();//We auto instantiate the method in order to have it get the information from the API and display on load of the controller

        //This method starts a process and gets the associated starting tasks of the process and displays them
        //It takes one param, the process unique identifier that we want to start
        $scope.startProcess = function(pro_uid){
            //Setting the process uid to localStorage for later use
            $localStorage.pro_uid = pro_uid;
            //Set the requestType
            API.setRequestType('project/'+$localStorage.pro_uid+'/starting-tasks');
            //Call to the REST API to list all available starting tasks for the specified process
            API.call(function(response){
                //Send the list of new cases to localStorage so that the NewcaseCtrl controller can use it
                $localStorage.startingTasks = response.data;
                //Change the url so that the new case page is displayed
                $location.url('/newcase');
            });
        };
    });