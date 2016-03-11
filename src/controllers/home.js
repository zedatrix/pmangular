/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name HomeCtrl
 * @desc This controls the Home page
 */
'use strict';
angular.module('pmAngular')
.controller('HomeController', function ($scope, $localStorage){
    //Check if user is logged in
    if( ! $scope.authenticated() ){
        //No message in the localStorage, so set newMessage to false
        $scope.newMessage = false;
        //Display the default message
        $scope.WelcomeMessage = '$$DefaultWelcomeMessage$$';
        //Destory the message in the localStorage now that we have displayed it in the scope
        $localStorage.message = null;
        return;
    }
    //Check if localStorage has a message to display
    if ( $localStorage.message ){
        //Set the newMessage to true so that it will show on the home page
        $scope.newMessage = true;
        //Set the message to the scope so that we can render it in the view
        $scope.WelcomeMessage = $localStorage.message;
    }else{
        //No message in the localStorage, so set newMessage to false
        $scope.newMessage = false;
        //Display the default message
        $scope.WelcomeMessage = '$$WelcomeMessage$$';
    }
    //Destory the message in the localStorage now that we have displayed it in the scope
    $localStorage.message = null;
});