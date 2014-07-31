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
    'oauth.directive',      // login directive
    'oauth.accessToken',    // access token service
    'oauth.endpoint',       // oauth endpoint service
    'oauth.profile',        // profile model
    'oauth.interceptor',    // bearer token interceptor
    'ngRoute',              //application view and routing service
    'ui.bootstrap'          //Bootstrap framework for AngularJS
  ]);