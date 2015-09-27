/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name config
 * @desc Configuration file for the pmAngular app
 */

angular.module('pmAngular')
.config(['$routeProvider', '$locationProvider', '$httpProvider', '$browserProvider', function($routeProvider, $locationProvider, $httpProvider, $browserProvider){
    //Configure the url routes, this is basically the navigation of the app
    //For each route we define it's associated: template, controller, template variables: page name and description
    $routeProvider.when('/', {
        redirectTo: 'home'
    }).
        when('/authorized',{
            templateUrl: 'views/authorized.html',
            controller: 'AuthorizedCtrl',
            currentPage: 'Authorized',
            pageDesc: 'AngularJS meets ProcessMaker! This is your Authorized Page!'
        }).
        when('home',{
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
        otherwise({
            redirectTo: 'home'
        });
        // override the $browser.baseHref() method so it returns "/" without needing to use a <base href="/"> element
        // in the head of the document (which causes problems with SVG patterns amongst other things)
        //document.write("<base href='/repos/pmangular/dist/' />");
        //document.baseURI.href ='/repos/pmangular/dist/';
        /*var theBase = document.getElementsByTagName("base");
        theBase[0].href = '/repos/pmangular/dist/';*/
        //baseHref = function() { return "http://localhost/repos/pmangular/dist/" };
    // configure html5 to get links working on jsfiddle
        //$browserProvider.baseHref = function() { return "http://localhost/repos/pmangular/dist/" };
    $locationProvider.html5Mode(true);

    $httpProvider.interceptors.push('ExpiredInterceptor');
}])
.run(function($rootScope, $http, $browser){
    $rootScope.$on('oauth:login', function(event, token){
        $http.defaults.headers.common.Authorization = 'Bearer ' + token.access_token;
    });
    $rootScope.$on('oauth:logout', function(){
        console.log('logged out');
    });


        //console.log($browser.baseHref());

});

//The url for the REST API
var api_url = 'http://pm.stable/api/1.0/workflow/';
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