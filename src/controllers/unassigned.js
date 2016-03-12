/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name UnassignedCtrl
 * @desc This controls the Unassigned page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('UnassignedController', function ($scope, API) {
        //Set the requestType
        API.setRequestType('cases/unassigned');
        //Make the API call to get the list of cases in unassigned status
        API.call(function(response){
            //Assign the data received from the API to the scope so that we can render the view with the data
            $scope.casesList = response.data;
            //If the resulting data length is equal to 0, then we display a user friendly
            //Message stating that there is nothing to display
            if($scope.casesList.length===0){
                //#cases-table is the area on the page we are rendering
                //The list of cases, so we are setting it's HTML equal to the display message
                Helpers.showMessageArea('#cases-table',
                    '$$NoCasesMessage$$', true);
            }
        });
    });