/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name config
 * @desc Configuration file for the pmAngular app
 */
'use strict';
angular.module('pmAngular').
config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider){
    //Configure the url routes, this is basically the navigation of the app
    //For each route we define it's associated: template, controller, template variables: page name and description
    $routeProvider.when('/', {
        redirectTo: '/home'
    }).
        when('/home',{
            templateUrl: 'views/home.html',
            controller: 'HomeCtrl',
            currentPage: 'Home',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Home Page!'
        }).
        when('/newprocess', {
            templateUrl: 'views/newprocess.html',
            controller: 'NewprocessCtrl',
            currentPage: 'New Process',
            pageDesc: 'AngularJS meets ProcessMaker! This is your New Process Page!'
        }).
        when('/newcase', {
            templateUrl: 'views/newcase.html',
            controller: 'NewcaseCtrl',
            currentPage: 'New Case',
            pageDesc: 'AngularJS meets ProcessMaker! This is your New Case Page!'
        }).
        when('/opencase', {
            templateUrl: 'views/dynaform.html',
            controller: 'DynaformCtrl',
            currentPage: 'Dynaform',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Dynaform Page!'
        }).
        when('/inbox', {
            templateUrl: 'views/inbox.html',
            controller: 'InboxCtrl',
            currentPage: 'Inbox',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Inbox Page!'
        }).
        when('/draft', {
            templateUrl: 'views/draft.html',
            controller: 'DraftCtrl',
            currentPage: 'Draft',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Draft Page!'
        }).
        when('/participated', {
            templateUrl: 'views/participated.html',
            controller: 'ParticipatedCtrl',
            currentPage: 'Participated',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Participated Page!'
        }).
        when('/unassigned', {
            templateUrl: 'views/unassigned.html',
            controller: 'UnassignedCtrl',
            currentPage: 'Unassigned',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Unassigned Page!'
        }).
        otherwise({
            redirectTo: '/home'
        });
    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('ExpiredInterceptor');
}]);
//The url for the REST API
var api_url = 'http://173.244.64.117:8080/api/1.0/workflow/';
//Inject the REST API url into our application so that we can use it
angular.module('pmAngular').value('api_url', api_url);
//Inject the name of the application into our application so that we can use iit
//When we render the page
angular.module('pmAngular').value('appTitle', 'pmAngular');
//Define the generic header for the case list view
angular.module('pmAngular').value('genericHeaders', [
    {title: 'Case #'},
    {title: 'Process'},
    {title: 'Task'},
    {title: 'Sent By'},
    {title: 'Due Date'},
    {title: 'Last Modified'},
    {title: 'Priority'}
]);
//Define the active menu items for the application
angular.module('pmAngular').value('activeMenuItems',
    {
        'New Process' : 'newprocessSelected',
        'Inbox': 'inboxSelected',
        'Draft' : 'draftSelected',
        'Participated' : 'participatedSelected',
        'Unassigned' : 'unassignedSelected'
    }
);