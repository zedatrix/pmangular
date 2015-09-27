/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name pmOauth
 * @desc Service for connecting to ProcessMaker OAuth 2.0
 * @desc This is based off of oauth-ng - v0.2.0-beta.2 - 2014-06-05
 */
'use strict';
// App libraries
angular.module('oauth', [
    'oauth.directive',      // login directive
    'oauth.accessToken',    // access token service
    'oauth.endpoint',       // oauth endpoint service
    'oauth.profile',        // profile model
    'oauth.interceptor'     // bearer token interceptor
])
.config(['$locationProvider','$httpProvider',
  function($locationProvider, $httpProvider) {
    $httpProvider.interceptors.push('ExpiredInterceptor');
  }]);
var directives = angular.module('oauth.directive', []);

directives.directive('oauth', ['AccessToken', 'Endpoint', 'Profile', '$location', '$rootScope', '$compile', '$http', '$templateCache',
    function(AccessToken, Endpoint, Profile, $location, $rootScope, $compile, $http, $templateCache) {

        var definition = {
            restrict: 'AE',
            replace: true,
            scope: {
                site: '@',          // (required) set the oauth server host (e.g. http://oauth.example.com)
                clientId: '@',      // (required) client id
                redirectUri: '@',   // (required) client redirect uri
                scope: '@',         // (optional) scope
                profileUri: '@',    // (optional) user profile uri (e.g http://example.com/me)
                template: '@',      // (optional) template to render (e.g bower_components/oauth-ng/dist/views/templates/default.html)
                text: '@',          // (optional) login text
                authorizePath: '@'  // (optional) authorization url
            }
        };

        definition.link = function postLink(scope, element) {
            scope.show = 'none';

            scope.$watch('clientId', function() {
                init();                    // sets defaults
                compile();                 // compiles the desired layout
                Endpoint.set(scope);       // sets the oauth authorization url
                AccessToken.set(scope);    // sets the access token object (if existing, from fragment or session)
                initProfile(scope);        // gets the profile resource (if existing the access token)
                initView();                // sets the view (logged in or out)
            });
            scope.$watch(function(){
                return AccessToken.get();
            }, function(value){
                if (value) initView();
            });

            var init = function() {
                scope.authorizePath = scope.authorizePath || '/workflow/oauth2/authorize';
                scope.tokenPath     = scope.tokenPath     || '/api/1.0/workflow/token';
                scope.template      = scope.template      || 'views/templates/button.html';
                scope.text          = scope.text          || 'Sign In';
            };

            var compile = function() {
                $http.get(scope.template, { cache: $templateCache }).success(function(html) {
                    element.html(html);
                    $compile(element.contents())(scope);
                });
            };

            var initProfile = function(scope) {
                var token = AccessToken.get();

                if (token && token.access_token && scope.profileUri) {
                    Profile.find(scope.profileUri).success(function(response) { scope.profile = response; });
                }
            };

            var initView = function(token) {
                token = AccessToken.get();

                if (!token)             { return loggedOut(); }   // without access token it's logged out
                if (token.access_token) { return loggedIn(); }    // if there is the access token we are done
                if (token.error)        { return denied(); }      // if the request has been denied we fire the denied event
            };


            scope.login = function() {
                Endpoint.redirect();
            };

            scope.logout = function() {
                AccessToken.destroy(scope);
                loggedOut();
            };

            // set the oauth directive to the logged-in status
            var loggedIn = function() {
                $rootScope.$broadcast('oauth:login', AccessToken.get());
                scope.show = 'logged-in';
            };

            // set the oauth directive to the logged-out status
            var loggedOut = function() {
                $rootScope.$broadcast('oauth:logout');
                scope.show = 'logged-out';
            };

            // set the oauth directive to the denied status
            var denied = function() {
                scope.show = 'denied';
                $rootScope.$broadcast('oauth:denied');
            };

            // Updates the template at runtime
            scope.$on('oauth:template:update', function(event, template) {
                scope.template = template;
                compile(scope);
            });
        };

        return definition;
    }]);


var service = angular.module('oauth.interceptor', []);

service.factory('ExpiredInterceptor', ['$rootScope', '$q', '$localStorage',
    function ($rootScope, $q, $localStorage) {

        var service = {};

        service.request = function(config) {
            var token = $localStorage.token;

            if (token && expired(token))
                $rootScope.$broadcast('oauth:expired', token);

            return config;
        };

        var expired = function(token) {
            return (token && token.expires_at && new Date(token.expires_at) < new Date());
        };

        return service;
    }]);


var service = angular.module('oauth.accessToken', ['ngStorage']);

service.factory('AccessToken', ['$rootScope', '$location', '$http', '$localStorage', 'api_url',
    function($rootScope, $location, $http, $localStorage, api_url) {

        var service = {};
        var token   = null;


        /*
         * Returns the access token.
         */

        service.get = function() {
            return token;
        };


        /*
         * Sets and returns the access token. It tries (in order) the following strategies:
         * - takes the token from the fragment URI
         * - takes the token from the sessionStorage
         */

        service.set = function() {
            setTokenFromString();
            setTokenFromSession();
            return token;
        };

        /*
         *  Delete the access token and remove the session.
         */

        service.destroy = function() {
            delete $localStorage.token;
            token = null;
            return token;
        };


        /*
         * Tells if the access token is expired.
         */

        service.expired = function() {
            return (token && token.expires_at && token.expires_at < new Date());
        };



        /* * * * * * * * * *
         * PRIVATE METHODS *
         * * * * * * * * * */


        /*
         * Get the access token from a string and save it
         */

        var setTokenFromString = function() {
            var hash = $location.url();
            var splitted = hash.split('&');
            var params = {};

            for (var i = 0; i < splitted.length; i++) {
                var param  = splitted[i].split('=');
                var key    = param[0];
                var value  = param[1];
                params[key] = value;
            }

            if (params.access_token || params.error)
                return params;

            var posOfCode = hash.indexOf('code');
            if(posOfCode > 0){
                var posOfAmp = hash.indexOf('&');
                var code = ( posOfAmp > 0 ) ? hash.substr(posOfCode, posOfAmp) : hash.substr(posOfCode);
                code = code.split('=');
                code = code[1].split('&');
                //$http.defaults.headers.common.Authorization = 'Basic 91038256653d6ae3f675792092307712';
                $http.post(api_url+'oauth2/token',
                    {
                        grant_type: 'authorization_code',
                        code: code[0],
                        client_id: 'NYNRYVNKKNYGUYNGURAAKCWCRLUQEPKS',
                        client_secret: '5519814215526ca9ebd4a93002540483',
                        redirect_uri: 'http://localhost/repos/pmangular/dist'
                    }).
                    then(function(response){
                        $http.defaults.headers.common.Authorization = 'Bearer '+response.data.access_token;
                        params = response.data;
                        $location.url('/home');
                        if (params) {
                            removeFragment();
                            service.setToken(params);
                        }
                    });
            }
        };



        /*
         * Set the access token from the sessionStorage.
         */

        var setTokenFromSession = function() {
            if ($localStorage.token) {
                var params = $localStorage.token;
                service.setToken(params);
            }
        };


        /*
         * Save the access token into the session
         */

        var setTokenInSession = function() {
            $localStorage.token = token;
        };


        /*
         * Set the access token.
         */

        service.setToken = function(params) {
            token = token || {};                 // init the token
            angular.extend(token, params);      // set the access token params
            setExpiresAt();                     // set the expiring time
            setTokenInSession();                // save the token into the session
            return token;
        };


        /*
         * Set the access token expiration date (useful for refresh logics)
         */

        var setExpiresAt = function() {
            if (token) {
                var expires_at = new Date();
                expires_at.setSeconds(expires_at.getSeconds() + parseInt(token.expires_in) - 60); // 60 seconds less to secure browser and response latency
                token.expires_at = expires_at;
            }
        };


        /*
         * Remove the fragment URI
         * TODO we need to remove only the access token
         */

        var removeFragment = function() {
            $location.hash('');
        };


        return service;
    }]);


var client = angular.module('oauth.endpoint', []);

client.factory('Endpoint', ['AccessToken', '$location',
    function(AccessToken, $location) {

        var service = {};
        var url;


        /*
         * Defines the authorization URL
         */

        service.set = function(scope) {
            url = scope.site +
                scope.authorizePath +
                '?response_type=code&' +
                'client_id=' + scope.clientId + '&' +
                'redirect_uri=' + scope.redirectUri + '&' +
                'scope=' + scope.scope + '&' +
                'state=' + $location.url();
            return url;
        };


        /*
         * Returns the authorization URL
         */

        service.get = function() {
            return url;
        };


        /*
         * Redirects the app to the authorization URL
         */

        service.redirect = function() {
            window.location.replace(url);
        };

        return service;
    }]);


var client = angular.module('oauth.profile', []);

client.factory('Profile', ['$http', 'AccessToken', function($http, AccessToken) {
    var service = {};
    var profile;

    service.find = function(uri) {
        var promise = $http.get(uri, { headers: headers() });
        promise.success(function(response) { profile = response; });
        return promise;
    };

    service.get = function() {
        return profile;
    };

    service.set = function(resource) {
        profile = resource;
        return profile;
    };

    var headers = function() {
        return { Authorization: 'Bearer ' + AccessToken.get().access_token };
    };

    return service;
}]);
