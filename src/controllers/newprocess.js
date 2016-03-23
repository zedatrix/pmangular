/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewprocessCtrl
 * @desc This controls the New Process Page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewprocessController', function ($scope, $state, $http, $location, $localStorage, API, Helpers){


        $scope.getProcessList = function(){
            Helpers.showMessageArea('#new-process-message',
                'Your list of processes is loading. Please wait.', 'info');
            //Set the requestType
            API.setRequestType('project');
            //Make the API call to get the list of available processes
            API.call(function(response){
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if(response.data.length===0){
                    //#new-process-area is the area on the page we are rendering
                    //The list of processes, so we are setting it's HTML equal to the display message
                    return Helpers.showMessageArea('#new-process-area',
                        '$$NoProcessesToDisplayMessage$$', 'info');
                }
                var projects = response.data;
                $scope.proList = {};
                angular.forEach(projects, function(project){
                    API.setRequestType('project/'+project.prj_uid+'/starting-tasks');
                    //Call to the REST API to list all available starting tasks for the specified process
                    API.call(function(prj_response) {
                        //Send the list of new cases to localStorage so that the NewcaseCtrl controller can use it
                        //If the resulting data length is equal to 0, then we display a user friendly
                        //Message stating that there is nothing to display
                        if (project.length !== 0 && project.prj_status === 'ACTIVE' && prj_response.data.length !== 0) {
                            //Assign the data received from the API to the scope so that we
                            //Can render the template with the data
                            //console.log(prj_response.data);
                            $scope.proList[project.prj_uid] = {
                                prj_name: project.prj_name,
                                prj_uid: project.prj_uid,
                                prj_starting_tasks: prj_response.data
                            };
                        }
                    });
                });
                $localStorage.proList = $scope.proList;
                //Hide the message so to the user since the list of processes is loaded
                $('#new-process-message').hide(5000);
            });


        }();//We auto instantiate the method in order to have it get the information from the API and display on load of the controller

        //This method starts a process and gets the associated starting tasks of the process and displays them
        //It takes one param, the process unique identifier that we want to start
        $scope.startProcess = function(pro_uid){
            //Setting the process uid to localStorage for later use
            $localStorage.pro_uid = pro_uid;
            //Change the url so that the new case page is displayed
            $state.go('app.newcase');
        };
    });