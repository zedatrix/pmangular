angular.module('pmAngular')
    .config(['$locationProvider', '$httpProvider', '$browserProvider', '$stateProvider', '$urlRouterProvider', function($locationProvider, $httpProvider, $browserProvider, $stateProvider, $urlRouterProvider){
        //Configure the url routes, this is basically the navigation of the app
        //For each route we define it's associated: template, controller, template variables: page name and description
        $urlRouterProvider.otherwise('/app/home');

        $stateProvider
            .state('app', {
                url: '/app',
                //abstract: true,
                pageDesc: 'AngularJS meets ProcessMaker! This is your App Page!',
                currentPage: 'App',
                views: {
                    'sidebar@': {
                        templateUrl: 'views/sidebar.html'
                    },
                    'content@': {
                        templateUrl: 'views/app.html'
                    }
                }
            })
            .state('app.home', {
                url: '/home',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Home Page!',
                currentPage: 'Home',
                views: {
                    'content@': {
                        controller: 'HomeController',
                        templateUrl: 'views/home.html'
                    }
                }
            })
            .state('app.inbox', {
                url: '/inbox',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Inbox Page!',
                currentPage: 'Inbox',
                views: {
                    'content@': {
                        controller: 'InboxController',
                        templateUrl: 'views/inbox.html'
                    }
                }
            })
            .state('app.draft', {
                url: '/draft',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Draft Page!',
                currentPage: 'Draft',
                views: {
                    'content@': {
                        controller: 'DraftController',
                        templateUrl: 'views/draft.html'
                    }
                }
            })
            .state('app.newprocess', {
                url: '/newprocess',
                pageDesc: 'AngularJS meets ProcessMaker! This is your New Process Page!',
                currentPage: 'New Process',
                views: {
                    'content@': {
                        controller: 'NewprocessController',
                        templateUrl: 'views/newprocess.html'
                    }
                }
            })
            .state('app.newcase', {
                url: '/newcase',
                pageDesc: 'AngularJS meets ProcessMaker! This is your New Case Page!',
                currentPage: 'New Case',
                views: {
                    'content@': {
                        controller: 'NewcaseController',
                        templateUrl: 'views/newcase.html'
                    }
                }
            })
            .state('app.opencase', {
                url: '/opencase',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Dynaform Page!',
                currentPage: 'Dynaform',
                views: {
                    'content@': {
                        controller: 'DynaformController',
                        templateUrl: 'views/dynaform.html'
                    }
                }
            })
            .state('app.participated', {
                url: '/participated',
                pageDesc: 'AngularJS meets ProcessMaker! This is your Participated Page!',
                currentPage: 'Participated',
                views: {
                    'content@': {
                        controller: 'ParticipatedController',
                        templateUrl: 'views/participated.html'
                    }
                }
            })

        ;

        $locationProvider.html5Mode(true);

        $httpProvider.interceptors.push('ExpiredInterceptor');
    }]);