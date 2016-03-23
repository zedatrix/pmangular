/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name DynaformCtrl
 * @desc This controls the Dynaform
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
    .controller('DynaformController', function ($scope, $location, $state, $localStorage, API, Message, Helpers) {

        //Instantiate the dynaform object so that we can assign properties to it
        $scope.dynaform = {};
console.log('here');
        //Set the requestType
        API.setRequestType('project/'+$localStorage.pro_uid+'/activity/'+$localStorage.act_uid+'/steps');
        //Make the API call to get the list of steps
        API.call(function(response){
            //Get the first object/form for the demo application
            //In a real world example you would have to build logic at this point to
            //Check if there is a form associated with this step
            if( ! response.data.length > 0 ){
                Message.setMessageType('danger');
                Message.setMessageText('$$NoStepToDisplay$$');
                return $state.go('app.home');

            }
            //Display the appropriate steps
            //Assign the dynaform uid / step uid to localStorage for persistence
            $localStorage.step_uid_obj = response.data[0].step_uid_obj;
            //Set the requestType
            API.setRequestType('project/'+$localStorage.pro_uid+'/dynaform/'+$localStorage.step_uid_obj);
                //Make a call to the API requesting dynaform definition in order to render the form
            API.call(function(response){
                var dynaformContent = JSON.parse(response.data.dyn_content);
                $localStorage.dyn_uid = response.data.dyn_uid;
                $scope.dynaform.mainTitle = response.data.dyn_title;
                var fields = dynaformContent.items[0].items;
                $scope.dynaform.app_number = $localStorage.app_number;
                $scope.dynaform.fields = fields;
                $scope.dynaform.submit = fields[fields.length-1][0];
                $scope.loadCaseData();
            }, 'GET', undefined, function(e){
                Helpers.showMessageArea('#start-case-area',
                    'There has been a problem with your request. Please try again later.'+
                    '</p><p>'+
                    'Error Message: <pre>'+ JSON.stringify(e, null, '\t')+
                    '</pre></p>', 'danger');
            });

        });
        /**
         * @author ethan@colosa.com
         * @name submitCase
         * @desc Submits the form to ProcessMaker to save the data and takes the user back to their inbox
         */

        $scope.submitCase = function(){
            //Set the delegation index equal to 1 if there is no delegation index, this would mean that the case is
            //Currently in draft status, otherwise, if the delegation is not null, just assign it value of the delegation
            //index
            $localStorage.delIndex = ($localStorage.delIndex === null) ? 1 : $localStorage.delIndex;
            //Instantiate an object in order to use to create the object that we will be sending to ProcessMaker
            //Set the requestType
            API.setRequestType('cases/'+$localStorage.app_uid+'/variable');
            //Set the params for the put request
            API.setParams($scope.fieldData);
            //Make a call to the API to submit the data to be saved to the cases variables
            API.call(function(response){
                    //If the response is not equal to 0 than we know the request was successful
                    if(response!==0){
                        //Set the requestType
                        API.setRequestType('cases/'+$localStorage.app_uid+'/route-case');
                        //Set the params for the put request
                        API.setParams({'del_index': $localStorage.delIndex, 'Content-Type': 'application/json;charset=utf-8'});
                        //Make a call to the API to route the case to the next task
                        //Something to note for production environments:
                        //This specific workflow was a sequential workflow. For production environemnts you may need to add
                        //Custom logic for interpreting the routing procedure for other types of routing rules
                        API.call(function(){
                                //Reset the delegation index since we have submitted the form
                                $localStorage.delIndex = null;
                                //Reset the applications unique identifier since we have submitted the form
                                $localStorage.app_uid = null;
                                //Send the user back to their home inbox since they have submitted the form
                                $location.url('/home');
                                //Display a user friendly message to the user that they have successfully submitted the case
                                Message.setMessageText('$$FormSubmittedMessage$$');
                                Message.setMessageType('success');
                            },
                            //Define the request type, in this case, PUT
                            'PUT');
                    }
                },
                //Define the request type, in this case, PUT
                'PUT');
        };
        /**
         * @author ethan@colosa.com
         * @name loadCaseData
         * @desc Loads the data from the case and populates the form with it
         */
        $scope.loadCaseData = function(){
            //Set the requestType
            API.setRequestType('cases/'+$localStorage.app_uid+'/variables');
            //Make a call to the API requesting the data of the case
            API.call(function(response){
                //If the length of the data is greater than 0, we know the request was successful
                if($(response.data).size() > 0){
                    //Assign the response to a variable for easier use
                    $scope.fieldData = response.data;
                }
            });
        };

    });