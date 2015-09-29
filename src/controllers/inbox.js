/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name InboxCtrl
 * @desc This controls the Inbox page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('InboxController', function (API, $scope){
        //Set the requestType
        console.log('here');
        API.setRequestType('cases');
        //Make the API call to get the list of cases in To Do status
        API.call(function(response){
            //Assign the data received from the API to the scope so that we can render the view with the data
            $scope.casesList = response.data;
            //If the resulting data length is equal to 0, then we display a user friendly
            //Message stating that there is nothing to display
            if($scope.casesList.length===0){
                /**
                 * Todo create some type of directive/service to render messages in the application with just a quick function call
                 */
                $('#cases-table').html(
                    '<div class="alert alert-block alert-info">'+
                        '<button type="button" class="close" data-dismiss="alert">'+
                        '<i class="icon-remove"></i>'+
                        '</button>'+
                        '<i class="icon-ok blue"></i>'+
                        '$$NoCasesMessage$$'+
                        '</div>'
                );
            }
        });
    });