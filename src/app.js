'use strict';

/**
 * @author ethan@colosa.com
 * @ngdoc overview
 * @name pmAngularApp
 * @description
 * # pmAngular is a native AngularJS front end inbox that connects to ProcessMaker 3.0 REST API with OAuth 2.0
 *
 * Main module of the application.
 */
//Create the app
angular.module('pmAngular', [
    'oauth',
    'ui.bootstrap',          //Bootstrap framework for AngularJS
    'ui.router'
]);