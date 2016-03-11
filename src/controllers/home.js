/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name HomeCtrl
 * @desc This controls the Home page
 */
'use strict';
angular.module('pmAngular')
.controller('HomeController', function ($scope, $localStorage, Message){
    //Check if user is logged in
    if( ! $scope.authenticated() ){
        //Display the default message
        Message.setMessageText('$$DefaultWelcomeMessage$$');
        Message.setMessageType('warning');
        return;
    }
});