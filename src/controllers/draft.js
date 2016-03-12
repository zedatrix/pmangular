/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name DraftCtrl
 * @desc This controls the Draft page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('DraftController', function (API, $scope){
    //Set the requestType
    API.setRequestType('cases/draft');
    //Make the API call to get the list of cases in draft status

        //Assign the data received from the API to the scope so that we can render the view with the data
        try{
            API.call(function(response){
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
        }catch(e){
            Helpers.showMessageArea('#cases-table',
                'There has been a problem with your request. Please try again later.'+
                '\n'+
                '</p><p>'+
                'Error Message: <pre>'+ JSON.stringify(e, null, '\t')+
                '</pre></p>', true);
        }


});