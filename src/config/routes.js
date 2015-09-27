angular.module('pmAngular')
    .config(['$locationProvider', '$httpProvider', '$browserProvider', '$stateProvider', '$urlRouterProvider', function($locationProvider, $httpProvider, $browserProvider, $stateProvider, $urlRouterProvider){
        //Configure the url routes, this is basically the navigation of the app
        //For each route we define it's associated: template, controller, template variables: page name and description
        $urlRouterProvider.otherwise('/home');

        $stateProvider
            .state('home', {
                url: '/home',
                controller: 'HomeCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Home Page!',
                currentPage: 'Home',
                templateUrl: 'views/home.html'
            })

            .state('newprocess', {
                url: '/newprocess',
                controller: 'NewprocessCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your New Process Page!',
                currentPage: 'New Process',
                templateUrl: 'views/newprocess.html'
            })
            .state('newcase', {
                url: '/newcase',
                controller: 'NewcaseCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your New Case Page!',
                currentPage: 'New Case',
                templateUrl: 'views/newcase.html'
            })
            .state('opencase', {
                url: '/opencase',
                controller: 'DynaformCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Dynaform Page!',
                currentPage: 'Dynaform',
                templateUrl: 'views/dynaform.html'
            })
            .state('inbox', {
                url: '/inbox',
                controller: 'InboxCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Inbox Page!',
                currentPage: 'Inbox',
                templateUrl: 'views/inbox.html'
            })
            .state('draft', {
                url: '/draft',
                controller: 'DraftCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Draft Page!',
                currentPage: 'Draft',
                templateUrl: 'views/draft.html'
            })
            .state('participated', {
                url: '/participated',
                controller: 'ParticipatedCtrl',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Participated Page!',
                currentPage: 'Participated',
                templateUrl: 'views/participated.html'
            });

        $locationProvider.html5Mode(true);

        $httpProvider.interceptors.push('ExpiredInterceptor');
    }]);