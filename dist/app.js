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
    //'ngRoute',              //application view and routing service
    'ui.bootstrap',          //Bootstrap framework for AngularJS
    'ui.router'
]);
angular.module('pmAngular')
    .config(['$locationProvider', '$httpProvider', '$browserProvider', '$stateProvider', '$urlRouterProvider', function($locationProvider, $httpProvider, $browserProvider, $stateProvider, $urlRouterProvider){
        //Configure the url routes, this is basically the navigation of the app
        //For each route we define it's associated: template, controller, template variables: page name and description
        $urlRouterProvider.otherwise('/app');

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
                        //templateUrl: 'views/app.html'
                    }
                }
            })
            .state('app.home', {
                url: '',
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
//The url for the REST API
angular.module('pmAngular').value('api_url', 'http://pm.stable/api/1.0/workflow/');
angular.module('pmAngular').value('config_object', {
		oauth_button : {
			text: 'Log In',
			scope: 'view_processes edit_processes',
			site: 'http://pm.stable/workflow',
			clientId: 'JJVBJCMUHORMHERIGJLZUHNLRIQTOVQY',
			redirectUri: 'http://localhost/repos/pmangular/dist',
			authorizePath: '/oauth2/authorize',
			tokenPath: '/oauth2/token'
		}
	}
);
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
/* oauth-ng - v0.4.2 - 2015-06-19 */

'use strict';

// App libraries
angular.module('oauth', [
  'oauth.directive',      // login directive
  'oauth.accessToken',    // access token service
  'oauth.endpoint',       // oauth endpoint service
  'oauth.profile',        // profile model
  'oauth.storage',        // storage
  'oauth.interceptor'     // bearer token interceptor
])
  .config(['$locationProvider','$httpProvider',
  function($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
    $httpProvider.interceptors.push('ExpiredInterceptor');
  }]);

'use strict';

var accessTokenService = angular.module('oauth.accessToken', []);

accessTokenService.factory('AccessToken', ['Storage', '$rootScope', '$location', '$interval', function(Storage, $rootScope, $location, $interval){

  var service = {
    token: null
  },
  oAuth2HashTokens = [ //per http://tools.ietf.org/html/rfc6749#section-4.2.2
    'access_token', 'token_type', 'expires_in', 'scope', 'state',
    'error','error_description'
  ];

  /**
   * Returns the access token.
   */
  service.get = function(){
    return this.token;
  };

  /**
   * Sets and returns the access token. It tries (in order) the following strategies:
   * - takes the token from the fragment URI
   * - takes the token from the sessionStorage
   */
  service.set = function(){
    this.setTokenFromString($location.hash());

    //If hash is present in URL always use it, cuz its coming from oAuth2 provider redirect
    if(null === service.token){
      setTokenFromSession();
    }

    return this.token;
  };

  /**
   * Delete the access token and remove the session.
   * @returns {null}
   */
  service.destroy = function(){
    Storage.delete('token');
    this.token = null;
    return this.token;
  };

  /**
   * Tells if the access token is expired.
   */
  service.expired = function(){
    return (this.token && this.token.expires_at && new Date(this.token.expires_at) < new Date());
  };

  /**
   * Get the access token from a string and save it
   * @param hash
   */
  service.setTokenFromString = function(hash){
    var params = getTokenFromString(hash);

    if(params){
      removeFragment();
      setToken(params);
      setExpiresAt();
      // We have to save it again to make sure expires_at is set
      //  and the expiry event is set up properly
      setToken(this.token);
      $rootScope.$broadcast('oauth:login', service.token);
    }
  };

  /* * * * * * * * * *
   * PRIVATE METHODS *
   * * * * * * * * * */

  /**
   * Set the access token from the sessionStorage.
   */
  var setTokenFromSession = function(){
    var params = Storage.get('token');
    if (params) {
      setToken(params);
    }
  };

  /**
   * Set the access token.
   *
   * @param params
   * @returns {*|{}}
   */
  var setToken = function(params){
    service.token = service.token || {};      // init the token
    angular.extend(service.token, params);      // set the access token params
    setTokenInSession();                // save the token into the session
    setExpiresAtEvent();                // event to fire when the token expires

    return service.token;
  };

  /**
   * Parse the fragment URI and return an object
   * @param hash
   * @returns {{}}
   */
  var getTokenFromString = function(hash){
    var params = {},
        regex = /([^&=]+)=([^&]*)/g,
        m;

    while ((m = regex.exec(hash)) !== null) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }

    if(params.access_token || params.error){
      return params;
    }
  };

  /**
   * Save the access token into the session
   */
  var setTokenInSession = function(){
    Storage.set('token', service.token);
  };

  /**
   * Set the access token expiration date (useful for refresh logics)
   */
  var setExpiresAt = function(){
    if (!service.token) {
      return;
    }
    if(typeof(service.token.expires_in) !== 'undefined' && service.token.expires_in !== null) {
      var expires_at = new Date();
      expires_at.setSeconds(expires_at.getSeconds() + parseInt(service.token.expires_in)-60); // 60 seconds less to secure browser and response latency
      service.token.expires_at = expires_at;
    }
    else {
      service.token.expires_at = null;
    }
  };


  /**
   * Set the timeout at which the expired event is fired
   */
  var setExpiresAtEvent = function(){
    // Don't bother if there's no expires token
    if (typeof(service.token.expires_at) === 'undefined' || service.token.expires_at === null) {
      return;
    }
    var time = (new Date(service.token.expires_at))-(new Date());
    if(time){
      $interval(function(){
        $rootScope.$broadcast('oauth:expired', service.token);
      }, time, 1);
    }
  };

  /**
   * Remove the oAuth2 pieces from the hash fragment
   */
  var removeFragment = function(){
    var curHash = $location.hash();
    angular.forEach(oAuth2HashTokens,function(hashKey){
      var re = new RegExp('&'+hashKey+'(=[^&]*)?|^'+hashKey+'(=[^&]*)?&?');
      curHash = curHash.replace(re,'');
    });

    $location.hash(curHash);
  };

  return service;

}]);

'use strict';

var endpointClient = angular.module('oauth.endpoint', []);

endpointClient.factory('Endpoint', function() {

  var service = {};

  /*
   * Defines the authorization URL
   */

  service.set = function(configuration) {
    this.config = configuration;
    return this.get();
  };

  /*
   * Returns the authorization URL
   */

  service.get = function( overrides ) {
    var params = angular.extend( {}, service.config, overrides);
    var oAuthScope = (params.scope) ? encodeURIComponent(params.scope) : '',
        state = (params.state) ? encodeURIComponent(params.state) : '',
        authPathHasQuery = (params.authorizePath.indexOf('?') === -1) ? false : true,
        appendChar = (authPathHasQuery) ? '&' : '?',    //if authorizePath has ? already append OAuth2 params
        responseType = (params.responseType) ? encodeURIComponent(params.responseType) : '';

    var url = params.site +
          params.authorizePath +
          appendChar + 'response_type=' + responseType + '&' +
          'client_id=' + encodeURIComponent(params.clientId) + '&' +
          'redirect_uri=' + encodeURIComponent(params.redirectUri) + '&' +
          'scope=' + oAuthScope + '&' +
          'state=' + state;

    if( params.nonce ) {
      url = url + '&nonce=' + params.nonce;
    }
    return url;
  };

  /*
   * Redirects the app to the authorization URL
   */

  service.redirect = function( overrides ) {
    var targetLocation = this.get( overrides );
    window.location.replace(targetLocation);
  };

  return service;
});

'use strict';

var profileClient = angular.module('oauth.profile', []);

profileClient.factory('Profile', ['$http', 'AccessToken', '$rootScope', function($http, AccessToken, $rootScope) {
  var service = {};
  var profile;

  service.find = function(uri) {
    var promise = $http.get(uri, { headers: headers() });
    promise.success(function(response) {
        profile = response;
        $rootScope.$broadcast('oauth:profile', profile);
      });
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

'use strict';

var storageService = angular.module('oauth.storage', ['ngStorage']);

storageService.factory('Storage', ['$rootScope', '$sessionStorage', '$localStorage', function($rootScope, $sessionStorage, $localStorage){

  var service = {
    storage: $sessionStorage // By default
  };

  /**
   * Deletes the item from storage,
   * Returns the item's previous value
   */
  service.delete = function (name) {
    var stored = this.get(name);
    delete this.storage[name];
    return stored;
  };

  /**
   * Returns the item from storage
   */
  service.get = function (name) {
    return this.storage[name];
  };

  /**
   * Sets the item in storage to the value specified
   * Returns the item's value
   */
  service.set = function (name, value) {
    this.storage[name] = value;
    return this.get(name);
  };

  /**
   * Change the storage service being used
   */
  service.use = function (storage) {
    if (storage === 'sessionStorage') {
      this.storage = $sessionStorage;
    } else if (storage === 'localStorage') {
      this.storage = $localStorage;
    }
  };

  return service;
}]);
'use strict';

var interceptorService = angular.module('oauth.interceptor', []);

interceptorService.factory('ExpiredInterceptor', ['Storage', '$rootScope', function (Storage, $rootScope) {

  var service = {};

  service.request = function(config) {
    var token = Storage.get('token');

    if (token && expired(token)) {
      $rootScope.$broadcast('oauth:expired', token);
    }

    return config;
  };

  var expired = function(token) {
    return (token && token.expires_at && new Date(token.expires_at) < new Date());
  };

  return service;
}]);

'use strict';

var directives = angular.module('oauth.directive', []);

directives.directive('oauth', [
  'AccessToken',
  'Endpoint',
  'Profile',
  'Storage',
  '$location',
  '$rootScope',
  '$compile',
  '$http',
  '$templateCache',
  'config_object',
  function(AccessToken, Endpoint, Profile, Storage, $location, $rootScope, $compile, $http, $templateCache, config_object) {

    var definition = {
      restrict: 'AE',
      replace: true,
      scope: {
        site: '@',          // (required) set the oauth server host (e.g. http://oauth.example.com)
        clientId: '@',      // (required) client id
        redirectUri: '@',   // (required) client redirect uri
        responseType: '@',  // (optional) response type, defaults to token (use 'token' for implicit flow and 'code' for authorization code flow
        scope: '@',         // (optional) scope
        profileUri: '@',    // (optional) user profile uri (e.g http://example.com/me)
        template: '@',      // (optional) template to render (e.g bower_components/oauth-ng/dist/views/templates/default.html)
        text: '@',          // (optional) login text
        authorizePath: '@', // (optional) authorization url
        state: '@',         // (optional) An arbitrary unique string created by your app to guard against Cross-site Request Forgery
        storage: '@'        // (optional) Store token in 'sessionStorage' or 'localStorage', defaults to 'sessionStorage'
      }
    };

    definition.link = function postLink(scope, element) {
      scope.show = 'none';

      scope.$watch('clientId', function() {
        init();
      });

      var init = function() {
        initAttributes();          // sets defaults
        Storage.use(scope.storage);// set storage
        compile();                 // compiles the desired layout
        Endpoint.set(scope);       // sets the oauth authorization url
        AccessToken.set(scope);    // sets the access token object (if existing, from fragment or session)
        initProfile(scope);        // gets the profile resource (if existing the access token)
        initView();                // sets the view (logged in or out)
      };

      var initAttributes = function() {
        scope.authorizePath = scope.authorizePath || config_object.oauth_button.authorizePath;
        scope.tokenPath     = scope.tokenPath     || config_object.oauth_button.tokenPath;
        scope.template      = scope.template      || 'views/templates/button.html';
        scope.responseType  = scope.responseType  || 'token';
        scope.text          = scope.text          || config_object.oauth_button.text;
        scope.state         = scope.state         || undefined;
        scope.scope         = scope.scope         || config_object.oauth_button.scope;
        scope.storage       = scope.storage       || 'sessionStorage';
        scope.site          = scope.site          || config_object.oauth_button.site;
        scope.clientId      = scope.clientId      || config_object.oauth_button.clientId;
        scope.redirectUri   = scope.redirectUri   || config_object.oauth_button.redirectUri;
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
          Profile.find(scope.profileUri).success(function(response) {
            scope.profile = response;
          });
        }
      };

      var initView = function() {
        var token = AccessToken.get();

        if (!token) {
          return loggedOut(); // without access token it's logged out
        }
        if (token.access_token) {
          return authorized(); // if there is the access token we are done
        }
        if (token.error) {
          return denied(); // if the request has been denied we fire the denied event
        }
      };

      scope.login = function() {
        Endpoint.redirect();
      };

      scope.logout = function() {
        AccessToken.destroy(scope);
        $rootScope.$broadcast('oauth:logout');
        loggedOut();
      };

      scope.$on('oauth:expired', function() {
        AccessToken.destroy(scope);
        scope.show = 'logged-out';
      });

      // user is authorized
      var authorized = function() {
        $rootScope.$broadcast('oauth:authorized', AccessToken.get());
        scope.show = 'logged-in';
      };

      // set the oauth directive to the logged-out status
      var loggedOut = function() {
        $rootScope.$broadcast('oauth:loggedOut');
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

      // Hack to update the directive content on logout
      // TODO think to a cleaner solution
      scope.$on('$routeChangeSuccess', function () {
        init();
      });
    };

    return definition;
  }
]);

/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name API
 * @desc API Service for connecting to the ProcessMaker 3.0 REST API
 */
'use strict';
//Service to make API calls to the REST API
//We are passing $http to make ajax requests and the url for the REST API
angular.module('pmAngular').
service('API', function($http, api_url){
    //We are defining the requestType, this is the specific endpoint of the REST API we are requesting
    //Params are any parameters that we are passing as part of a post/put request
    var requestType, params;
    //Define the functionality of the service
    return {
        /**
         * @author ethan@colosa.com
         * @name getRequestType
         * @desc Get method for getting the current request type
         * @returns {*}
         */
        getRequestType: function () {
            return requestType;
        },
        /**
         * @author ethan@colosa.com
         * @name setRequestType
         * @desc Set method for setting the current request type
         * @param value
         */
        setRequestType: function(value) {
            requestType = value;
        },
        /**
         * @author ethan@colosa.com
         * @name getParams
         * @desc Get method for getting the current params
         * @returns {*}
         */
        getParams: function(){
            return params;
        },

        /**
         * @author ethan@colosa.com
         * @name setParams
         * @desc Set method for setting the current params
         * @param value
         */
        setParams: function(value){
            params = value;
        },
        /**
         *
         * @name setParams
         * @desc This is the main function of the service. It makes a call to the REST API
         * @param callback - required
         * @param requestType - optional
         * @param method - optional
         */
        call: function(callback, method, requestType){

            //Define optional params so that only callback needs to be specified when this function is called
            //Assign default value og GET to the method that we are requesting

            if( typeof ( method ) === 'undefined') method = 'GET';

            //Assign the default value of the request type to the getter method.
            //This is the way to use the service. Set the setRequestType to the url endpoint you want to hit
            //For example, if you want a list of projects/process, in your controller do this before you call this method:
            //API.setRequestType('projects');

            if( typeof ( requestType ) === 'undefined') requestType = this.getRequestType();

            //Handle if there was no request type defined

            if( typeof ( requestType ) === 'undefined') return 'Invalid requestType or no requestType defined.';

            /*
             Switch based on method type in order to request the right type of api
             Default is the GET method, because this is the most common method used
             Convert the method to upper case for consistency

             First, we make the appropriate ajax call with the relevant end point attached to it
             Then, we check if a callback is defined, if so, we run it while passing the response
             from the server to it.
             */

            switch(method.toUpperCase()){
                case 'GET':
                    $http.get(api_url+requestType).
                        then(function(response){
                            if(callback) callback(response);
                        });
                    break;
                case 'POST':
                    $http.post(api_url+requestType, params).
                        then(function(response){
                            if(callback) callback(response);
                        });
                    break;
                case 'PUT':
                    $http.put(api_url+requestType, params).
                        then(function(response){
                            if(callback) callback(response);
                        });
                    break;
                default:
                    console.log('Invalid or no method defined.');
                    break;
            }
        }
    };
});
/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name ngstorage
 * @desc
 */
'use strict';
/*jshint -W030 */

(function() {

    /**
     * @ngdoc overview
     * @name ngStorage
     */

    angular.module('ngStorage', []).

    /**
     * @ngdoc object
     * @name ngStorage.$localStorage
     * @requires $rootScope
     * @requires $window
     */

        factory('$localStorage', _storageFactory('localStorage')).

    /**
     * @ngdoc object
     * @name ngStorage.$sessionStorage
     * @requires $rootScope
     * @requires $window
     */

        factory('$sessionStorage', _storageFactory('sessionStorage'));

    function _storageFactory(storageType) {
        return [
            '$rootScope',
            '$window',

            function(
                $rootScope,
                $window
                ){
                // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
                var webStorage = $window[storageType] || (console.warn('This browser does not support Web Storage!'), {}),
                    $storage = {
                        $default: function(items) {
                            for (var k in items) {
                                angular.isDefined($storage[k]) || ($storage[k] = items[k]);
                            }

                            return $storage;
                        },
                        $reset: function(items) {
                            for (var k in $storage) {
                                '$' === k[0] || delete $storage[k];
                            }

                            return $storage.$default(items);
                        }
                    },
                    _last$storage,
                    _debounce;

                for (var i = 0, k; i < webStorage.length; i++) {
                    // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                    (k = webStorage.key(i)) && 'ngStorage-' === k.slice(0, 10) && ($storage[k.slice(10)] = angular.fromJson(webStorage.getItem(k)));
                }

                _last$storage = angular.copy($storage);

                $rootScope.$watch(function() {
                    _debounce || (_debounce = setTimeout(function() {
                        _debounce = null;

                        if (!angular.equals($storage, _last$storage)) {
                            angular.forEach($storage, function(v, k) {
                                angular.isDefined(v) && '$' !== k[0] && webStorage.setItem('ngStorage-' + k, angular.toJson(v));

                                delete _last$storage[k];
                            });

                            for (var k in _last$storage) {
                                webStorage.removeItem('ngStorage-' + k);
                            }

                            _last$storage = angular.copy($storage);
                        }
                    }, 100));
                });

                // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
                'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function(event) {
                    if ('ngStorage-' === event.key.slice(0, 10)) {
                        event.newValue ? $storage[event.key.slice(10)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(10)];

                        _last$storage = angular.copy($storage);

                        $rootScope.$apply();
                    }
                });

                return $storage;
            }
        ];
    }

})();

/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name DraftCtrl
 * @desc This controls the Draft page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('DraftController', function (API, $scope){
    //Set the requestType
    API.setRequestType('cases/draft');
    //Make the API call to get the list of cases in draft status
    API.call(function(response){
        //Assign the data received from the API to the scope so that we can render the view with the data
        $scope.casesList = response.data;
        //If the resulting data length is equal to 0, then we display a user friendly
        //Message stating that there is nothing to display
        if($scope.casesList.length===0){
            //#cases-table is the area on the page we are rendering
            //The list of cases, so we are setting it's HTML equal to the display message
            /**
             * Todo create some type of directive/service to render messages in the application with just a quick function call
             */
            $('#cases-table').html(
                '<div class="alert alert-block alert-info">'+
                    '<button type="button" class="close" data-dismiss="alert">'+
                        '<i class="icon-remove"></i>'+
                    '</button>'+
                    '<i class="icon-ok blue"></i>'+
                        'There are no cases to display. Please choose another folder.'+
                '</div>'
            );
        }
    });

});
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name DynaformCtrl
 * @desc This controls the Dynaform
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('DynaformController', function ($scope, $location, $localStorage, API) {

        //Instantiate the dynaform object so that we can assign properties to it
        $scope.dynaform = {};
        //Set the requestType
        API.setRequestType('project/'+$localStorage.pro_uid+'/activity/'+$localStorage.act_uid+'/steps');
        //Make the API call to get the list of steps
        API.call(function(response){
            //Get the first object/form for the demo application
            //In a real world example you would have to build logic at this point to
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
            //In the .each loop
            var dataObj = {};
            //Here we get all the input elements on the form and put them into the object created above
            //ToDo support for other elements besides input e.g. select, textarea, radio, check
            $('form').find(':input').each(function(){
                //We first check to make sure that the field has a proper id
                //Then we assign to the object a key of the field id with the value of the field
                if ( typeof($(this).attr('id')) !== 'undefined' ) dataObj[$(this).attr('id')] = $(this).val();
            });
            //Set the requestType
            API.setRequestType('cases/'+$localStorage.app_uid+'/variable');
            //Set the params for the put request
            API.setParams(dataObj);
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
                        $localStorage.message = 'Thank you for submitting the case. You may continue with other work now!';
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
                    var data = response.data;
                    //Loop through all the input elements on the form and populate them with the data retrieved from the API
                    //ToDo support for other elements besides input e.g. select, textarea, radio, check
                    $('form').find(':input').each(function(){
                        //We first check to make sure that the field has a proper id
                        //Then we assign to the field's value with the associated field returned from the API
                        if ( typeof($(this).attr('id')) !== 'undefined' ) $(this).val(data[$(this).attr('id')]);
                    });
                }
            });
        };

    });
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name HomeCtrl
 * @desc This controls the Home page
 */
'use strict';
angular.module('pmAngular')
.controller('HomeController', function ($scope, $localStorage){
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
        $scope.WelcomeMessage = 'Welcome to the Angular JS ProcessMaker Front End! You are successfully logged in!';
    }
    //Destory the message in the localStorage now that we have displayed it in the scope
    $localStorage.message = null;
});
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name InboxCtrl
 * @desc This controls the Inbox page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('InboxController', function (API, $scope){
        //Set the requestType
        console.log('here');
        API.setRequestType('cases');
        //Make the API call to get the list of cases in To Do status
        API.call(function(response){
            //Assign the data received from the API to the scope so that we can render the view with the data
            $scope.casesList = response.data;
            //If the resulting data length is equal to 0, then we display a user friendly
            //Message stating that there is nothing to display
            if($scope.casesList.length===0){
                /**
                 * Todo create some type of directive/service to render messages in the application with just a quick function call
                 */
                $('#cases-table').html(
                    '<div class="alert alert-block alert-info">'+
                        '<button type="button" class="close" data-dismiss="alert">'+
                        '<i class="icon-remove"></i>'+
                        '</button>'+
                        '<i class="icon-ok blue"></i>'+
                        'There are no cases to display. Please choose another folder.'+
                        '</div>'
                );
            }
        });
    });
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewcaseCtrl
 * @desc This controls the New Case page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewcaseController', function ($scope, $http, $location, $localStorage, API){
        //Assign the list of starting tasks from localStorage to the scope so that we can render it in the view
        $scope.taskList = $localStorage.startingTasks;
        /**
         * @author ethan@colosa.com
         * @name startCase
         * @desc Starts a new case in ProcessMaker
         */
        $scope.startCase = function(act_uid){
            //Setting the activity uid to localStorage for later use
            $localStorage.act_uid = act_uid;
            //Set the requestType
            API.setRequestType('cases');
            //Set the params for the post request
            API.setParams({pro_uid: $localStorage.pro_uid, tas_uid: $localStorage.act_uid});
            //Make a call to the REST API to start a case
            API.call(function(response){
                //If the length of the data returned from the API is greater than 0, then we know we're in business!
                if( $(response.data).size() > 0 ){
                    //Send the user to the opencase page, there we display the dynaform
                    $location.url('/opencase');
                    //Set the localStorage application unique identifier to that which was returned from the server
                    $localStorage.app_uid = response.data.app_uid;
                    //Set the localStorage application number to that which was returned from the server
                    $localStorage.app_number = response.data.app_number;
                }
            },
            //Define the request type, in this case, POST
            'POST');
        };
});
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name NewprocessCtrl
 * @desc This controls the New Process Page
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('NewprocessController', function ($rootScope, $scope, $http, $location, $localStorage, API){
        $scope.getProcessList = function(){
            //Set the requestType
            API.setRequestType('project');
            //Make the API call to get the list of available processes
            API.call(function(response){
                //Assign the data received from the API to the scope so that we
                //Can render the template with the data
                $scope.proList = response.data;
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if($scope.proList.length===0){
                    //#new-process-area is the area on the page we are rendering
                    //The list of processes, so we are setting it's HTML equal to the display message
                    $('#new-process-area').html('$$NoProcessesToDisplayMessage$$');
                }
                });
        }();//We auto instantiate the method in order to have it get the information from the API and display on load of the controller

        //This method starts a process and gets the associated starting tasks of the process and displays them
        //It takes one param, the process unique identifier that we want to start
        $scope.startProcess = function(pro_uid){
            //Setting the process uid to localStorage for later use
            $localStorage.pro_uid = pro_uid;
            //Set the requestType
            API.setRequestType('project/'+$localStorage.pro_uid+'/starting-tasks');
            //Call to the REST API to list all available starting tasks for the specified process
            API.call(function(response){
                //Send the list of new cases to localStorage so that the NewcaseCtrl controller can use it
                $localStorage.startingTasks = response.data;
                //Change the url so that the new case page is displayed
                $location.url('/newcase');
            });
        };
    });
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name ParticipatedCtrl
 * @desc This controls the Participated page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('ParticipatedController', function ($scope, API) {
    //Set the requestType
    API.setRequestType('cases/participated');
    //Make the API call to get the list of cases in participated status
    API.call(function(response){
        //Assign the data received from the API to the scope so that we can render the view with the data
        $scope.casesList = response.data;
        //If the resulting data length is equal to 0, then we display a user friendly
        //Message stating that there is nothing to display
        if($scope.casesList.length===0){
            /**
             * Todo create some type of directive/service to render messages in the application with just a quick function call
             */
            $('#cases-table').html(
                '<div class="alert alert-block alert-info">'+
                    '<button type="button" class="close" data-dismiss="alert">'+
                    '<i class="icon-remove"></i>'+
                    '</button>'+
                    '<i class="icon-ok blue"></i>'+
                    'There are no cases to display. Please choose another folder.'+
                '</div>'
            );
        }
    });
});
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name RootCtrl
 * @desc This is the root controller. It controls aspects related to the application from a higher level
 */
/*global $:false */
'use strict';
angular.module('pmAngular')
.controller('RootController', function RootCtrl($rootScope, $scope, $location, $localStorage, $state, $http, API, appTitle, genericHeaders, activeMenuItems, api_url, AccessToken){
    //Define the column names for the grids. In this case, we are creating global columns, but you could just redefine this array on any controller
    //To overwrite them for a specific page
    $scope.gridHeaders = genericHeaders;
    //Define the application title and set it to the scope so that the view renders it
    $scope.appTitle = appTitle;
    //This function sets the sidebar menu to active based on the page selected
    $scope.setSelectedPage = function(currentPage){
        //List of all the menu items so that we can loop through them
        var list = activeMenuItems;
        //Loop through all the menu items
        $.each(list, function(key, value){
            //Check if the current page is equal a key
            //If it is, make it active
            if(currentPage === key) $scope[value] = 'active';
            //Otherwise, make the rest of them inactive so only the currently active one is displayed as active
            else $scope[value] = '';
        });
    };
        /**
         * @name !!!Events!!!
         * @desc This is where we will define a bunch of events and what happens during those events
         * @desc Fun stuff!!!!
         */
    //When the applications state has changed to another route, we want to fire some things on this event
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        //Change the menu item selected as active whenever the page is changed
        $scope.setSelectedPage(toState.currentPage);
        //Set the current pages name to the current page
        $scope.currentPage = toState.currentPage;
        //Set the current pages description to the current pages description
        $scope.pageDesc = toState.pageDesc;
        //We want to destroy the delegation index if the current page is not a dynaform so that the next time
        //We load a page, it does not use a delegation index of a different application
        if($scope.currentPage !== 'Dynaform') $localStorage.delIndex = null;
        //During the authentication process the http headers could have changed to Basic
        //So we just reinforce the headers with the Bearer authorization as well as the updated access_token
        $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.accessToken;
    });
    //When the user logs in, we do some things on this event
    $rootScope.$on('oauth:login', function(event, token){
        //This is EXTREMELY important - The whole UI is rendered based on if this is an acces_token
        //So, we assign the scopes accessToken to the token
        //If the user is not logged in, the token object will be undefined
        //If the user IS logged in, the token object will hold the token information
        //E.g. access_token, refresh_token, expiry etc
        $localStorage.accessToken = token.access_token;
    });
    $rootScope.$on('oauth:loggedOut', function(event, token){
        //The user has logged out, so we destroy the access_token
        //Because of Angulars awesome live data binding, this automatically renders the view innate
        $localStorage.accessToken = null;
        //Destory the AccessToken object
        AccessToken.destroy();
        //Set the pages name to an unauthorized message
        $scope.currentPage = 'Please Login.';
        //Set the pages description to an unauthorized message
        $scope.pageDesc = 'Welcome to pmAngular. You need to log in with your ProcessMaker account in order to continue.';
        //Redirect the user back to the home page
        $state.go('app.home');
    });
    //When the user logs out, we do some things on this event
    $rootScope.$on('oauth:logout', function(){
        //The user has logged out, so we destroy the access_token
        //Because of Angulars awesome live data binding, this automatically renders the view innate
        $localStorage.accessToken = null;
        //Destory the AccessToken object
        AccessToken.destroy();
        //Set the pages name to an unauthorized message
        $scope.currentPage = 'Please Login.';
        //Set the pages description to an unauthorized message
        $scope.pageDesc = 'Welcome to pmAngular. You need to log in with your ProcessMaker account in order to continue.';
        //Redirect the user back to the home page
        $state.go('app.home');
    });

    /**
     * @author ethan@colosa.com
     * @name openCase
     * @desc Opens a dynaform and displays the data for the user
     * @param app_uid - required - the application unique identifier for the case you wish to open
     * @param delIndex - required - the delegation index of the current application that you are opening
     */
    $scope.openCase = function(app_uid, delIndex){
        //Hide the view of the cases list so that we can display the form
        $('#cases-table').hide();
        //Show the view of the form
        $('#form-area').show();
        API.setRequestType('cases/'+app_uid);
        API.call(function(response){
            if( $(response.data).size() > 0 ){
                //Assign the localStorage data:
                //The applications number
                $localStorage.app_number = response.data.app_number;
                //The process unique identifier that the case is associated to
                $localStorage.pro_uid = response.data.pro_uid;
                //The activity/form unique identifier that we are going to dispaly
                $localStorage.act_uid = response.data.current_task[0].tas_uid;
                //The unique identifier of the application
                $localStorage.app_uid = app_uid;
                //The delegation index of the application
                $localStorage.delIndex = delIndex;
                //Redirect the user to the opencase form where we will display the dynaform
                $location.path('/opencase');
            }
        });
    };

    $scope.authenticated = function() {
        if ($localStorage.accessToken && $localStorage.accessToken.length > 1) return true;
    }
});
/**
 * @author ethan@colosa.com
 * @date 7/29/14
 * @name UnassignedCtrl
 * @desc This controls the Unassigned page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('UnassignedController', function ($scope, API) {
        //Set the requestType
        API.setRequestType('cases/unassigned');
        //Make the API call to get the list of cases in unassigned status
        API.call(function(response){
            //Assign the data received from the API to the scope so that we can render the view with the data
            $scope.casesList = response.data;
            //If the resulting data length is equal to 0, then we display a user friendly
            //Message stating that there is nothing to display
            if($scope.casesList.length===0){
                /**
                 * Todo create some type of directive/service to render messages in the application with just a quick function call
                 */
                $('#cases-table').html(
                    '<div class="alert alert-block alert-info">'+
                        '<button type="button" class="close" data-dismiss="alert">'+
                        '<i class="icon-remove"></i>'+
                        '</button>'+
                        '<i class="icon-ok blue"></i>'+
                        'There are no cases to display. Please choose another folder.'+
                    '</div>'
                );
            }
        });
    });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInJvdXRlcy5qcyIsInZhcmlhYmxlcy5qcyIsIm5nLW9hdXRoLmpzIiwiYXBpLmpzIiwibmdzdG9yYWdlLmpzIiwiZHJhZnQuanMiLCJkeW5hZm9ybS5qcyIsImhvbWUuanMiLCJpbmJveC5qcyIsIm5ld2Nhc2UuanMiLCJuZXdwcm9jZXNzLmpzIiwicGFydGljaXBhdGVkLmpzIiwicm9vdC5qcyIsInVuYXNzaWduZWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcbiAqIEBuYW1lIHBtQW5ndWxhckFwcFxuICogQGRlc2NyaXB0aW9uXG4gKiAjIHBtQW5ndWxhciBpcyBhIG5hdGl2ZSBBbmd1bGFySlMgZnJvbnQgZW5kIGluYm94IHRoYXQgY29ubmVjdHMgdG8gUHJvY2Vzc01ha2VyIDMuMCBSRVNUIEFQSSB3aXRoIE9BdXRoIDIuMFxuICpcbiAqIE1haW4gbW9kdWxlIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAqL1xuLy9DcmVhdGUgdGhlIGFwcFxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicsIFtcbiAgICAnb2F1dGgnLFxuICAgIC8vJ25nUm91dGUnLCAgICAgICAgICAgICAgLy9hcHBsaWNhdGlvbiB2aWV3IGFuZCByb3V0aW5nIHNlcnZpY2VcbiAgICAndWkuYm9vdHN0cmFwJywgICAgICAgICAgLy9Cb290c3RyYXAgZnJhbWV3b3JrIGZvciBBbmd1bGFySlNcbiAgICAndWkucm91dGVyJ1xuXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4gICAgLmNvbmZpZyhbJyRsb2NhdGlvblByb3ZpZGVyJywgJyRodHRwUHJvdmlkZXInLCAnJGJyb3dzZXJQcm92aWRlcicsICckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInLCBmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlciwgJGJyb3dzZXJQcm92aWRlciwgJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcil7XG4gICAgICAgIC8vQ29uZmlndXJlIHRoZSB1cmwgcm91dGVzLCB0aGlzIGlzIGJhc2ljYWxseSB0aGUgbmF2aWdhdGlvbiBvZiB0aGUgYXBwXG4gICAgICAgIC8vRm9yIGVhY2ggcm91dGUgd2UgZGVmaW5lIGl0J3MgYXNzb2NpYXRlZDogdGVtcGxhdGUsIGNvbnRyb2xsZXIsIHRlbXBsYXRlIHZhcmlhYmxlczogcGFnZSBuYW1lIGFuZCBkZXNjcmlwdGlvblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwJyk7XG5cbiAgICAgICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9hcHAnLFxuICAgICAgICAgICAgICAgIC8vYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgQXBwIFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ0FwcCcsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3NpZGViYXJAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9zaWRlYmFyLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGVtcGxhdGVVcmw6ICd2aWV3cy9hcHAuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgICAgIHVybDogJycsXG4gICAgICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgSG9tZSBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdIb21lJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ob21lLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXRlKCdhcHAuaW5ib3gnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL2luYm94JyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBJbmJveCBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdJbmJveCcsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0luYm94Q29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2luYm94Lmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXRlKCdhcHAuZHJhZnQnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL2RyYWZ0JyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBEcmFmdCBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdEcmFmdCcsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0RyYWZ0Q29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2RyYWZ0Lmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXRlKCdhcHAubmV3cHJvY2VzcycsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvbmV3cHJvY2VzcycsXG4gICAgICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgTmV3IFByb2Nlc3MgUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnTmV3IFByb2Nlc3MnLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdOZXdwcm9jZXNzQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25ld3Byb2Nlc3MuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5uZXdjYXNlJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9uZXdjYXNlJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBOZXcgQ2FzZSBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdOZXcgQ2FzZScsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ05ld2Nhc2VDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbmV3Y2FzZS5odG1sJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwLm9wZW5jYXNlJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9vcGVuY2FzZScsXG4gICAgICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgRHluYWZvcm0gUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnRHluYWZvcm0nLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEeW5hZm9ybUNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9keW5hZm9ybS5odG1sJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwLnBhcnRpY2lwYXRlZCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvcGFydGljaXBhdGVkJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBQYXJ0aWNpcGF0ZWQgUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnUGFydGljaXBhdGVkJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUGFydGljaXBhdGVkQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3BhcnRpY2lwYXRlZC5odG1sJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICA7XG5cbiAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0V4cGlyZWRJbnRlcmNlcHRvcicpO1xuICAgIH1dKTsiLCIvL1RoZSB1cmwgZm9yIHRoZSBSRVNUIEFQSVxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdhcGlfdXJsJywgJyQkQXBpVXJsJCQnKTtcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnY29uZmlnX29iamVjdCcsICQkQ29uZmlnT2JqZWN0JCQpO1xuLy9JbmplY3QgdGhlIG5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uIGludG8gb3VyIGFwcGxpY2F0aW9uIHNvIHRoYXQgd2UgY2FuIHVzZSBpaXRcbi8vV2hlbiB3ZSByZW5kZXIgdGhlIHBhZ2VcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnYXBwVGl0bGUnLCAnJCRBcHBUaXRsZSQkJyk7XG4vL0RlZmluZSB0aGUgZ2VuZXJpYyBoZWFkZXIgZm9yIHRoZSBjYXNlIGxpc3Qgdmlld1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdnZW5lcmljSGVhZGVycycsIFtcbiAgICB7dGl0bGU6ICdDYXNlICMnfSxcbiAgICB7dGl0bGU6ICdQcm9jZXNzJ30sXG4gICAge3RpdGxlOiAnVGFzayd9LFxuICAgIHt0aXRsZTogJ1NlbnQgQnknfSxcbiAgICB7dGl0bGU6ICdEdWUgRGF0ZSd9LFxuICAgIHt0aXRsZTogJ0xhc3QgTW9kaWZpZWQnfSxcbiAgICB7dGl0bGU6ICdQcmlvcml0eSd9XG5dKTtcbi8vRGVmaW5lIHRoZSBhY3RpdmUgbWVudSBpdGVtcyBmb3IgdGhlIGFwcGxpY2F0aW9uXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2FjdGl2ZU1lbnVJdGVtcycsXG4gICAge1xuICAgICAgICAnTmV3IFByb2Nlc3MnIDogJ25ld3Byb2Nlc3NTZWxlY3RlZCcsXG4gICAgICAgICdJbmJveCc6ICdpbmJveFNlbGVjdGVkJyxcbiAgICAgICAgJ0RyYWZ0JyA6ICdkcmFmdFNlbGVjdGVkJyxcbiAgICAgICAgJ1BhcnRpY2lwYXRlZCcgOiAncGFydGljaXBhdGVkU2VsZWN0ZWQnLFxuICAgICAgICAnVW5hc3NpZ25lZCcgOiAndW5hc3NpZ25lZFNlbGVjdGVkJ1xuICAgIH1cbik7IiwiLyogb2F1dGgtbmcgLSB2MC40LjIgLSAyMDE1LTA2LTE5ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gQXBwIGxpYnJhcmllc1xuYW5ndWxhci5tb2R1bGUoJ29hdXRoJywgW1xuICAnb2F1dGguZGlyZWN0aXZlJywgICAgICAvLyBsb2dpbiBkaXJlY3RpdmVcbiAgJ29hdXRoLmFjY2Vzc1Rva2VuJywgICAgLy8gYWNjZXNzIHRva2VuIHNlcnZpY2VcbiAgJ29hdXRoLmVuZHBvaW50JywgICAgICAgLy8gb2F1dGggZW5kcG9pbnQgc2VydmljZVxuICAnb2F1dGgucHJvZmlsZScsICAgICAgICAvLyBwcm9maWxlIG1vZGVsXG4gICdvYXV0aC5zdG9yYWdlJywgICAgICAgIC8vIHN0b3JhZ2VcbiAgJ29hdXRoLmludGVyY2VwdG9yJyAgICAgLy8gYmVhcmVyIHRva2VuIGludGVyY2VwdG9yXG5dKVxuICAuY29uZmlnKFsnJGxvY2F0aW9uUHJvdmlkZXInLCckaHR0cFByb3ZpZGVyJyxcbiAgZnVuY3Rpb24oJGxvY2F0aW9uUHJvdmlkZXIsICRodHRwUHJvdmlkZXIpIHtcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSkuaGFzaFByZWZpeCgnIScpO1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0V4cGlyZWRJbnRlcmNlcHRvcicpO1xuICB9XSk7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGFjY2Vzc1Rva2VuU2VydmljZSA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5hY2Nlc3NUb2tlbicsIFtdKTtcblxuYWNjZXNzVG9rZW5TZXJ2aWNlLmZhY3RvcnkoJ0FjY2Vzc1Rva2VuJywgWydTdG9yYWdlJywgJyRyb290U2NvcGUnLCAnJGxvY2F0aW9uJywgJyRpbnRlcnZhbCcsIGZ1bmN0aW9uKFN0b3JhZ2UsICRyb290U2NvcGUsICRsb2NhdGlvbiwgJGludGVydmFsKXtcblxuICB2YXIgc2VydmljZSA9IHtcbiAgICB0b2tlbjogbnVsbFxuICB9LFxuICBvQXV0aDJIYXNoVG9rZW5zID0gWyAvL3BlciBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2NzQ5I3NlY3Rpb24tNC4yLjJcbiAgICAnYWNjZXNzX3Rva2VuJywgJ3Rva2VuX3R5cGUnLCAnZXhwaXJlc19pbicsICdzY29wZScsICdzdGF0ZScsXG4gICAgJ2Vycm9yJywnZXJyb3JfZGVzY3JpcHRpb24nXG4gIF07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFjY2VzcyB0b2tlbi5cbiAgICovXG4gIHNlcnZpY2UuZ2V0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcy50b2tlbjtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyBhbmQgcmV0dXJucyB0aGUgYWNjZXNzIHRva2VuLiBJdCB0cmllcyAoaW4gb3JkZXIpIHRoZSBmb2xsb3dpbmcgc3RyYXRlZ2llczpcbiAgICogLSB0YWtlcyB0aGUgdG9rZW4gZnJvbSB0aGUgZnJhZ21lbnQgVVJJXG4gICAqIC0gdGFrZXMgdGhlIHRva2VuIGZyb20gdGhlIHNlc3Npb25TdG9yYWdlXG4gICAqL1xuICBzZXJ2aWNlLnNldCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5zZXRUb2tlbkZyb21TdHJpbmcoJGxvY2F0aW9uLmhhc2goKSk7XG5cbiAgICAvL0lmIGhhc2ggaXMgcHJlc2VudCBpbiBVUkwgYWx3YXlzIHVzZSBpdCwgY3V6IGl0cyBjb21pbmcgZnJvbSBvQXV0aDIgcHJvdmlkZXIgcmVkaXJlY3RcbiAgICBpZihudWxsID09PSBzZXJ2aWNlLnRva2VuKXtcbiAgICAgIHNldFRva2VuRnJvbVNlc3Npb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50b2tlbjtcbiAgfTtcblxuICAvKipcbiAgICogRGVsZXRlIHRoZSBhY2Nlc3MgdG9rZW4gYW5kIHJlbW92ZSB0aGUgc2Vzc2lvbi5cbiAgICogQHJldHVybnMge251bGx9XG4gICAqL1xuICBzZXJ2aWNlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICAgIFN0b3JhZ2UuZGVsZXRlKCd0b2tlbicpO1xuICAgIHRoaXMudG9rZW4gPSBudWxsO1xuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUZWxscyBpZiB0aGUgYWNjZXNzIHRva2VuIGlzIGV4cGlyZWQuXG4gICAqL1xuICBzZXJ2aWNlLmV4cGlyZWQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAodGhpcy50b2tlbiAmJiB0aGlzLnRva2VuLmV4cGlyZXNfYXQgJiYgbmV3IERhdGUodGhpcy50b2tlbi5leHBpcmVzX2F0KSA8IG5ldyBEYXRlKCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY2VzcyB0b2tlbiBmcm9tIGEgc3RyaW5nIGFuZCBzYXZlIGl0XG4gICAqIEBwYXJhbSBoYXNoXG4gICAqL1xuICBzZXJ2aWNlLnNldFRva2VuRnJvbVN0cmluZyA9IGZ1bmN0aW9uKGhhc2gpe1xuICAgIHZhciBwYXJhbXMgPSBnZXRUb2tlbkZyb21TdHJpbmcoaGFzaCk7XG5cbiAgICBpZihwYXJhbXMpe1xuICAgICAgcmVtb3ZlRnJhZ21lbnQoKTtcbiAgICAgIHNldFRva2VuKHBhcmFtcyk7XG4gICAgICBzZXRFeHBpcmVzQXQoKTtcbiAgICAgIC8vIFdlIGhhdmUgdG8gc2F2ZSBpdCBhZ2FpbiB0byBtYWtlIHN1cmUgZXhwaXJlc19hdCBpcyBzZXRcbiAgICAgIC8vICBhbmQgdGhlIGV4cGlyeSBldmVudCBpcyBzZXQgdXAgcHJvcGVybHlcbiAgICAgIHNldFRva2VuKHRoaXMudG9rZW4pO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpsb2dpbicsIHNlcnZpY2UudG9rZW4pO1xuICAgIH1cbiAgfTtcblxuICAvKiAqICogKiAqICogKiAqICogKlxuICAgKiBQUklWQVRFIE1FVEhPRFMgKlxuICAgKiAqICogKiAqICogKiAqICogKi9cblxuICAvKipcbiAgICogU2V0IHRoZSBhY2Nlc3MgdG9rZW4gZnJvbSB0aGUgc2Vzc2lvblN0b3JhZ2UuXG4gICAqL1xuICB2YXIgc2V0VG9rZW5Gcm9tU2Vzc2lvbiA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHBhcmFtcyA9IFN0b3JhZ2UuZ2V0KCd0b2tlbicpO1xuICAgIGlmIChwYXJhbXMpIHtcbiAgICAgIHNldFRva2VuKHBhcmFtcyk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFjY2VzcyB0b2tlbi5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtc1xuICAgKiBAcmV0dXJucyB7Knx7fX1cbiAgICovXG4gIHZhciBzZXRUb2tlbiA9IGZ1bmN0aW9uKHBhcmFtcyl7XG4gICAgc2VydmljZS50b2tlbiA9IHNlcnZpY2UudG9rZW4gfHwge307ICAgICAgLy8gaW5pdCB0aGUgdG9rZW5cbiAgICBhbmd1bGFyLmV4dGVuZChzZXJ2aWNlLnRva2VuLCBwYXJhbXMpOyAgICAgIC8vIHNldCB0aGUgYWNjZXNzIHRva2VuIHBhcmFtc1xuICAgIHNldFRva2VuSW5TZXNzaW9uKCk7ICAgICAgICAgICAgICAgIC8vIHNhdmUgdGhlIHRva2VuIGludG8gdGhlIHNlc3Npb25cbiAgICBzZXRFeHBpcmVzQXRFdmVudCgpOyAgICAgICAgICAgICAgICAvLyBldmVudCB0byBmaXJlIHdoZW4gdGhlIHRva2VuIGV4cGlyZXNcblxuICAgIHJldHVybiBzZXJ2aWNlLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQYXJzZSB0aGUgZnJhZ21lbnQgVVJJIGFuZCByZXR1cm4gYW4gb2JqZWN0XG4gICAqIEBwYXJhbSBoYXNoXG4gICAqIEByZXR1cm5zIHt7fX1cbiAgICovXG4gIHZhciBnZXRUb2tlbkZyb21TdHJpbmcgPSBmdW5jdGlvbihoYXNoKXtcbiAgICB2YXIgcGFyYW1zID0ge30sXG4gICAgICAgIHJlZ2V4ID0gLyhbXiY9XSspPShbXiZdKikvZyxcbiAgICAgICAgbTtcblxuICAgIHdoaWxlICgobSA9IHJlZ2V4LmV4ZWMoaGFzaCkpICE9PSBudWxsKSB7XG4gICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KG1bMV0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChtWzJdKTtcbiAgICB9XG5cbiAgICBpZihwYXJhbXMuYWNjZXNzX3Rva2VuIHx8IHBhcmFtcy5lcnJvcil7XG4gICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgYWNjZXNzIHRva2VuIGludG8gdGhlIHNlc3Npb25cbiAgICovXG4gIHZhciBzZXRUb2tlbkluU2Vzc2lvbiA9IGZ1bmN0aW9uKCl7XG4gICAgU3RvcmFnZS5zZXQoJ3Rva2VuJywgc2VydmljZS50b2tlbik7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYWNjZXNzIHRva2VuIGV4cGlyYXRpb24gZGF0ZSAodXNlZnVsIGZvciByZWZyZXNoIGxvZ2ljcylcbiAgICovXG4gIHZhciBzZXRFeHBpcmVzQXQgPSBmdW5jdGlvbigpe1xuICAgIGlmICghc2VydmljZS50b2tlbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZih0eXBlb2Yoc2VydmljZS50b2tlbi5leHBpcmVzX2luKSAhPT0gJ3VuZGVmaW5lZCcgJiYgc2VydmljZS50b2tlbi5leHBpcmVzX2luICE9PSBudWxsKSB7XG4gICAgICB2YXIgZXhwaXJlc19hdCA9IG5ldyBEYXRlKCk7XG4gICAgICBleHBpcmVzX2F0LnNldFNlY29uZHMoZXhwaXJlc19hdC5nZXRTZWNvbmRzKCkgKyBwYXJzZUludChzZXJ2aWNlLnRva2VuLmV4cGlyZXNfaW4pLTYwKTsgLy8gNjAgc2Vjb25kcyBsZXNzIHRvIHNlY3VyZSBicm93c2VyIGFuZCByZXNwb25zZSBsYXRlbmN5XG4gICAgICBzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQgPSBleHBpcmVzX2F0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdGltZW91dCBhdCB3aGljaCB0aGUgZXhwaXJlZCBldmVudCBpcyBmaXJlZFxuICAgKi9cbiAgdmFyIHNldEV4cGlyZXNBdEV2ZW50ID0gZnVuY3Rpb24oKXtcbiAgICAvLyBEb24ndCBib3RoZXIgaWYgdGhlcmUncyBubyBleHBpcmVzIHRva2VuXG4gICAgaWYgKHR5cGVvZihzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQpID09PSAndW5kZWZpbmVkJyB8fCBzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWUgPSAobmV3IERhdGUoc2VydmljZS50b2tlbi5leHBpcmVzX2F0KSktKG5ldyBEYXRlKCkpO1xuICAgIGlmKHRpbWUpe1xuICAgICAgJGludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6ZXhwaXJlZCcsIHNlcnZpY2UudG9rZW4pO1xuICAgICAgfSwgdGltZSwgMSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIG9BdXRoMiBwaWVjZXMgZnJvbSB0aGUgaGFzaCBmcmFnbWVudFxuICAgKi9cbiAgdmFyIHJlbW92ZUZyYWdtZW50ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgY3VySGFzaCA9ICRsb2NhdGlvbi5oYXNoKCk7XG4gICAgYW5ndWxhci5mb3JFYWNoKG9BdXRoMkhhc2hUb2tlbnMsZnVuY3Rpb24oaGFzaEtleSl7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCcmJytoYXNoS2V5KycoPVteJl0qKT98XicraGFzaEtleSsnKD1bXiZdKik/Jj8nKTtcbiAgICAgIGN1ckhhc2ggPSBjdXJIYXNoLnJlcGxhY2UocmUsJycpO1xuICAgIH0pO1xuXG4gICAgJGxvY2F0aW9uLmhhc2goY3VySGFzaCk7XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG5cbn1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW5kcG9pbnRDbGllbnQgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGguZW5kcG9pbnQnLCBbXSk7XG5cbmVuZHBvaW50Q2xpZW50LmZhY3RvcnkoJ0VuZHBvaW50JywgZnVuY3Rpb24oKSB7XG5cbiAgdmFyIHNlcnZpY2UgPSB7fTtcblxuICAvKlxuICAgKiBEZWZpbmVzIHRoZSBhdXRob3JpemF0aW9uIFVSTFxuICAgKi9cblxuICBzZXJ2aWNlLnNldCA9IGZ1bmN0aW9uKGNvbmZpZ3VyYXRpb24pIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ3VyYXRpb247XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCk7XG4gIH07XG5cbiAgLypcbiAgICogUmV0dXJucyB0aGUgYXV0aG9yaXphdGlvbiBVUkxcbiAgICovXG5cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbiggb3ZlcnJpZGVzICkge1xuICAgIHZhciBwYXJhbXMgPSBhbmd1bGFyLmV4dGVuZCgge30sIHNlcnZpY2UuY29uZmlnLCBvdmVycmlkZXMpO1xuICAgIHZhciBvQXV0aFNjb3BlID0gKHBhcmFtcy5zY29wZSkgPyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnNjb3BlKSA6ICcnLFxuICAgICAgICBzdGF0ZSA9IChwYXJhbXMuc3RhdGUpID8gZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5zdGF0ZSkgOiAnJyxcbiAgICAgICAgYXV0aFBhdGhIYXNRdWVyeSA9IChwYXJhbXMuYXV0aG9yaXplUGF0aC5pbmRleE9mKCc/JykgPT09IC0xKSA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgYXBwZW5kQ2hhciA9IChhdXRoUGF0aEhhc1F1ZXJ5KSA/ICcmJyA6ICc/JywgICAgLy9pZiBhdXRob3JpemVQYXRoIGhhcyA/IGFscmVhZHkgYXBwZW5kIE9BdXRoMiBwYXJhbXNcbiAgICAgICAgcmVzcG9uc2VUeXBlID0gKHBhcmFtcy5yZXNwb25zZVR5cGUpID8gZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5yZXNwb25zZVR5cGUpIDogJyc7XG5cbiAgICB2YXIgdXJsID0gcGFyYW1zLnNpdGUgK1xuICAgICAgICAgIHBhcmFtcy5hdXRob3JpemVQYXRoICtcbiAgICAgICAgICBhcHBlbmRDaGFyICsgJ3Jlc3BvbnNlX3R5cGU9JyArIHJlc3BvbnNlVHlwZSArICcmJyArXG4gICAgICAgICAgJ2NsaWVudF9pZD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5jbGllbnRJZCkgKyAnJicgK1xuICAgICAgICAgICdyZWRpcmVjdF91cmk9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMucmVkaXJlY3RVcmkpICsgJyYnICtcbiAgICAgICAgICAnc2NvcGU9JyArIG9BdXRoU2NvcGUgKyAnJicgK1xuICAgICAgICAgICdzdGF0ZT0nICsgc3RhdGU7XG5cbiAgICBpZiggcGFyYW1zLm5vbmNlICkge1xuICAgICAgdXJsID0gdXJsICsgJyZub25jZT0nICsgcGFyYW1zLm5vbmNlO1xuICAgIH1cbiAgICByZXR1cm4gdXJsO1xuICB9O1xuXG4gIC8qXG4gICAqIFJlZGlyZWN0cyB0aGUgYXBwIHRvIHRoZSBhdXRob3JpemF0aW9uIFVSTFxuICAgKi9cblxuICBzZXJ2aWNlLnJlZGlyZWN0ID0gZnVuY3Rpb24oIG92ZXJyaWRlcyApIHtcbiAgICB2YXIgdGFyZ2V0TG9jYXRpb24gPSB0aGlzLmdldCggb3ZlcnJpZGVzICk7XG4gICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UodGFyZ2V0TG9jYXRpb24pO1xuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufSk7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHByb2ZpbGVDbGllbnQgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGgucHJvZmlsZScsIFtdKTtcblxucHJvZmlsZUNsaWVudC5mYWN0b3J5KCdQcm9maWxlJywgWyckaHR0cCcsICdBY2Nlc3NUb2tlbicsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsIEFjY2Vzc1Rva2VuLCAkcm9vdFNjb3BlKSB7XG4gIHZhciBzZXJ2aWNlID0ge307XG4gIHZhciBwcm9maWxlO1xuXG4gIHNlcnZpY2UuZmluZCA9IGZ1bmN0aW9uKHVyaSkge1xuICAgIHZhciBwcm9taXNlID0gJGh0dHAuZ2V0KHVyaSwgeyBoZWFkZXJzOiBoZWFkZXJzKCkgfSk7XG4gICAgcHJvbWlzZS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHByb2ZpbGUgPSByZXNwb25zZTtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpwcm9maWxlJywgcHJvZmlsZSk7XG4gICAgICB9KTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfTtcblxuICBzZXJ2aWNlLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBwcm9maWxlO1xuICB9O1xuXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24ocmVzb3VyY2UpIHtcbiAgICBwcm9maWxlID0gcmVzb3VyY2U7XG4gICAgcmV0dXJuIHByb2ZpbGU7XG4gIH07XG5cbiAgdmFyIGhlYWRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4geyBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBBY2Nlc3NUb2tlbi5nZXQoKS5hY2Nlc3NfdG9rZW4gfTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcbn1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RvcmFnZVNlcnZpY2UgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGguc3RvcmFnZScsIFsnbmdTdG9yYWdlJ10pO1xuXG5zdG9yYWdlU2VydmljZS5mYWN0b3J5KCdTdG9yYWdlJywgWyckcm9vdFNjb3BlJywgJyRzZXNzaW9uU3RvcmFnZScsICckbG9jYWxTdG9yYWdlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNlc3Npb25TdG9yYWdlLCAkbG9jYWxTdG9yYWdlKXtcblxuICB2YXIgc2VydmljZSA9IHtcbiAgICBzdG9yYWdlOiAkc2Vzc2lvblN0b3JhZ2UgLy8gQnkgZGVmYXVsdFxuICB9O1xuXG4gIC8qKlxuICAgKiBEZWxldGVzIHRoZSBpdGVtIGZyb20gc3RvcmFnZSxcbiAgICogUmV0dXJucyB0aGUgaXRlbSdzIHByZXZpb3VzIHZhbHVlXG4gICAqL1xuICBzZXJ2aWNlLmRlbGV0ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIHN0b3JlZCA9IHRoaXMuZ2V0KG5hbWUpO1xuICAgIGRlbGV0ZSB0aGlzLnN0b3JhZ2VbbmFtZV07XG4gICAgcmV0dXJuIHN0b3JlZDtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaXRlbSBmcm9tIHN0b3JhZ2VcbiAgICovXG4gIHNlcnZpY2UuZ2V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yYWdlW25hbWVdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpdGVtIGluIHN0b3JhZ2UgdG8gdGhlIHZhbHVlIHNwZWNpZmllZFxuICAgKiBSZXR1cm5zIHRoZSBpdGVtJ3MgdmFsdWVcbiAgICovXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5zdG9yYWdlW25hbWVdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KG5hbWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHN0b3JhZ2Ugc2VydmljZSBiZWluZyB1c2VkXG4gICAqL1xuICBzZXJ2aWNlLnVzZSA9IGZ1bmN0aW9uIChzdG9yYWdlKSB7XG4gICAgaWYgKHN0b3JhZ2UgPT09ICdzZXNzaW9uU3RvcmFnZScpIHtcbiAgICAgIHRoaXMuc3RvcmFnZSA9ICRzZXNzaW9uU3RvcmFnZTtcbiAgICB9IGVsc2UgaWYgKHN0b3JhZ2UgPT09ICdsb2NhbFN0b3JhZ2UnKSB7XG4gICAgICB0aGlzLnN0b3JhZ2UgPSAkbG9jYWxTdG9yYWdlO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcbn1dKTtcbid1c2Ugc3RyaWN0JztcblxudmFyIGludGVyY2VwdG9yU2VydmljZSA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5pbnRlcmNlcHRvcicsIFtdKTtcblxuaW50ZXJjZXB0b3JTZXJ2aWNlLmZhY3RvcnkoJ0V4cGlyZWRJbnRlcmNlcHRvcicsIFsnU3RvcmFnZScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24gKFN0b3JhZ2UsICRyb290U2NvcGUpIHtcblxuICB2YXIgc2VydmljZSA9IHt9O1xuXG4gIHNlcnZpY2UucmVxdWVzdCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciB0b2tlbiA9IFN0b3JhZ2UuZ2V0KCd0b2tlbicpO1xuXG4gICAgaWYgKHRva2VuICYmIGV4cGlyZWQodG9rZW4pKSB7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmV4cGlyZWQnLCB0b2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfTtcblxuICB2YXIgZXhwaXJlZCA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgcmV0dXJuICh0b2tlbiAmJiB0b2tlbi5leHBpcmVzX2F0ICYmIG5ldyBEYXRlKHRva2VuLmV4cGlyZXNfYXQpIDwgbmV3IERhdGUoKSk7XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGRpcmVjdGl2ZXMgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGguZGlyZWN0aXZlJywgW10pO1xuXG5kaXJlY3RpdmVzLmRpcmVjdGl2ZSgnb2F1dGgnLCBbXG4gICdBY2Nlc3NUb2tlbicsXG4gICdFbmRwb2ludCcsXG4gICdQcm9maWxlJyxcbiAgJ1N0b3JhZ2UnLFxuICAnJGxvY2F0aW9uJyxcbiAgJyRyb290U2NvcGUnLFxuICAnJGNvbXBpbGUnLFxuICAnJGh0dHAnLFxuICAnJHRlbXBsYXRlQ2FjaGUnLFxuICAnY29uZmlnX29iamVjdCcsXG4gIGZ1bmN0aW9uKEFjY2Vzc1Rva2VuLCBFbmRwb2ludCwgUHJvZmlsZSwgU3RvcmFnZSwgJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCAkY29tcGlsZSwgJGh0dHAsICR0ZW1wbGF0ZUNhY2hlLCBjb25maWdfb2JqZWN0KSB7XG5cbiAgICB2YXIgZGVmaW5pdGlvbiA9IHtcbiAgICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHNpdGU6ICdAJywgICAgICAgICAgLy8gKHJlcXVpcmVkKSBzZXQgdGhlIG9hdXRoIHNlcnZlciBob3N0IChlLmcuIGh0dHA6Ly9vYXV0aC5leGFtcGxlLmNvbSlcbiAgICAgICAgY2xpZW50SWQ6ICdAJywgICAgICAvLyAocmVxdWlyZWQpIGNsaWVudCBpZFxuICAgICAgICByZWRpcmVjdFVyaTogJ0AnLCAgIC8vIChyZXF1aXJlZCkgY2xpZW50IHJlZGlyZWN0IHVyaVxuICAgICAgICByZXNwb25zZVR5cGU6ICdAJywgIC8vIChvcHRpb25hbCkgcmVzcG9uc2UgdHlwZSwgZGVmYXVsdHMgdG8gdG9rZW4gKHVzZSAndG9rZW4nIGZvciBpbXBsaWNpdCBmbG93IGFuZCAnY29kZScgZm9yIGF1dGhvcml6YXRpb24gY29kZSBmbG93XG4gICAgICAgIHNjb3BlOiAnQCcsICAgICAgICAgLy8gKG9wdGlvbmFsKSBzY29wZVxuICAgICAgICBwcm9maWxlVXJpOiAnQCcsICAgIC8vIChvcHRpb25hbCkgdXNlciBwcm9maWxlIHVyaSAoZS5nIGh0dHA6Ly9leGFtcGxlLmNvbS9tZSlcbiAgICAgICAgdGVtcGxhdGU6ICdAJywgICAgICAvLyAob3B0aW9uYWwpIHRlbXBsYXRlIHRvIHJlbmRlciAoZS5nIGJvd2VyX2NvbXBvbmVudHMvb2F1dGgtbmcvZGlzdC92aWV3cy90ZW1wbGF0ZXMvZGVmYXVsdC5odG1sKVxuICAgICAgICB0ZXh0OiAnQCcsICAgICAgICAgIC8vIChvcHRpb25hbCkgbG9naW4gdGV4dFxuICAgICAgICBhdXRob3JpemVQYXRoOiAnQCcsIC8vIChvcHRpb25hbCkgYXV0aG9yaXphdGlvbiB1cmxcbiAgICAgICAgc3RhdGU6ICdAJywgICAgICAgICAvLyAob3B0aW9uYWwpIEFuIGFyYml0cmFyeSB1bmlxdWUgc3RyaW5nIGNyZWF0ZWQgYnkgeW91ciBhcHAgdG8gZ3VhcmQgYWdhaW5zdCBDcm9zcy1zaXRlIFJlcXVlc3QgRm9yZ2VyeVxuICAgICAgICBzdG9yYWdlOiAnQCcgICAgICAgIC8vIChvcHRpb25hbCkgU3RvcmUgdG9rZW4gaW4gJ3Nlc3Npb25TdG9yYWdlJyBvciAnbG9jYWxTdG9yYWdlJywgZGVmYXVsdHMgdG8gJ3Nlc3Npb25TdG9yYWdlJ1xuICAgICAgfVxuICAgIH07XG5cbiAgICBkZWZpbml0aW9uLmxpbmsgPSBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxlbWVudCkge1xuICAgICAgc2NvcGUuc2hvdyA9ICdub25lJztcblxuICAgICAgc2NvcGUuJHdhdGNoKCdjbGllbnRJZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpbml0KCk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaW5pdEF0dHJpYnV0ZXMoKTsgICAgICAgICAgLy8gc2V0cyBkZWZhdWx0c1xuICAgICAgICBTdG9yYWdlLnVzZShzY29wZS5zdG9yYWdlKTsvLyBzZXQgc3RvcmFnZVxuICAgICAgICBjb21waWxlKCk7ICAgICAgICAgICAgICAgICAvLyBjb21waWxlcyB0aGUgZGVzaXJlZCBsYXlvdXRcbiAgICAgICAgRW5kcG9pbnQuc2V0KHNjb3BlKTsgICAgICAgLy8gc2V0cyB0aGUgb2F1dGggYXV0aG9yaXphdGlvbiB1cmxcbiAgICAgICAgQWNjZXNzVG9rZW4uc2V0KHNjb3BlKTsgICAgLy8gc2V0cyB0aGUgYWNjZXNzIHRva2VuIG9iamVjdCAoaWYgZXhpc3RpbmcsIGZyb20gZnJhZ21lbnQgb3Igc2Vzc2lvbilcbiAgICAgICAgaW5pdFByb2ZpbGUoc2NvcGUpOyAgICAgICAgLy8gZ2V0cyB0aGUgcHJvZmlsZSByZXNvdXJjZSAoaWYgZXhpc3RpbmcgdGhlIGFjY2VzcyB0b2tlbilcbiAgICAgICAgaW5pdFZpZXcoKTsgICAgICAgICAgICAgICAgLy8gc2V0cyB0aGUgdmlldyAobG9nZ2VkIGluIG9yIG91dClcbiAgICAgIH07XG5cbiAgICAgIHZhciBpbml0QXR0cmlidXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzY29wZS5hdXRob3JpemVQYXRoID0gc2NvcGUuYXV0aG9yaXplUGF0aCB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5hdXRob3JpemVQYXRoO1xuICAgICAgICBzY29wZS50b2tlblBhdGggICAgID0gc2NvcGUudG9rZW5QYXRoICAgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi50b2tlblBhdGg7XG4gICAgICAgIHNjb3BlLnRlbXBsYXRlICAgICAgPSBzY29wZS50ZW1wbGF0ZSAgICAgIHx8ICd2aWV3cy90ZW1wbGF0ZXMvYnV0dG9uLmh0bWwnO1xuICAgICAgICBzY29wZS5yZXNwb25zZVR5cGUgID0gc2NvcGUucmVzcG9uc2VUeXBlICB8fCAndG9rZW4nO1xuICAgICAgICBzY29wZS50ZXh0ICAgICAgICAgID0gc2NvcGUudGV4dCAgICAgICAgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi50ZXh0O1xuICAgICAgICBzY29wZS5zdGF0ZSAgICAgICAgID0gc2NvcGUuc3RhdGUgICAgICAgICB8fCB1bmRlZmluZWQ7XG4gICAgICAgIHNjb3BlLnNjb3BlICAgICAgICAgPSBzY29wZS5zY29wZSAgICAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnNjb3BlO1xuICAgICAgICBzY29wZS5zdG9yYWdlICAgICAgID0gc2NvcGUuc3RvcmFnZSAgICAgICB8fCAnc2Vzc2lvblN0b3JhZ2UnO1xuICAgICAgICBzY29wZS5zaXRlICAgICAgICAgID0gc2NvcGUuc2l0ZSAgICAgICAgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5zaXRlO1xuICAgICAgICBzY29wZS5jbGllbnRJZCAgICAgID0gc2NvcGUuY2xpZW50SWQgICAgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5jbGllbnRJZDtcbiAgICAgICAgc2NvcGUucmVkaXJlY3RVcmkgICA9IHNjb3BlLnJlZGlyZWN0VXJpICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24ucmVkaXJlY3RVcmk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkaHR0cC5nZXQoc2NvcGUudGVtcGxhdGUsIHsgY2FjaGU6ICR0ZW1wbGF0ZUNhY2hlIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICAgIGVsZW1lbnQuaHRtbChodG1sKTtcbiAgICAgICAgICAkY29tcGlsZShlbGVtZW50LmNvbnRlbnRzKCkpKHNjb3BlKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgaW5pdFByb2ZpbGUgPSBmdW5jdGlvbihzY29wZSkge1xuICAgICAgICB2YXIgdG9rZW4gPSBBY2Nlc3NUb2tlbi5nZXQoKTtcblxuICAgICAgICBpZiAodG9rZW4gJiYgdG9rZW4uYWNjZXNzX3Rva2VuICYmIHNjb3BlLnByb2ZpbGVVcmkpIHtcbiAgICAgICAgICBQcm9maWxlLmZpbmQoc2NvcGUucHJvZmlsZVVyaSkuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgc2NvcGUucHJvZmlsZSA9IHJlc3BvbnNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgaW5pdFZpZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRva2VuID0gQWNjZXNzVG9rZW4uZ2V0KCk7XG5cbiAgICAgICAgaWYgKCF0b2tlbikge1xuICAgICAgICAgIHJldHVybiBsb2dnZWRPdXQoKTsgLy8gd2l0aG91dCBhY2Nlc3MgdG9rZW4gaXQncyBsb2dnZWQgb3V0XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuLmFjY2Vzc190b2tlbikge1xuICAgICAgICAgIHJldHVybiBhdXRob3JpemVkKCk7IC8vIGlmIHRoZXJlIGlzIHRoZSBhY2Nlc3MgdG9rZW4gd2UgYXJlIGRvbmVcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4uZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZGVuaWVkKCk7IC8vIGlmIHRoZSByZXF1ZXN0IGhhcyBiZWVuIGRlbmllZCB3ZSBmaXJlIHRoZSBkZW5pZWQgZXZlbnRcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NvcGUubG9naW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgRW5kcG9pbnQucmVkaXJlY3QoKTtcbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBBY2Nlc3NUb2tlbi5kZXN0cm95KHNjb3BlKTtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpsb2dvdXQnKTtcbiAgICAgICAgbG9nZ2VkT3V0KCk7XG4gICAgICB9O1xuXG4gICAgICBzY29wZS4kb24oJ29hdXRoOmV4cGlyZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgQWNjZXNzVG9rZW4uZGVzdHJveShzY29wZSk7XG4gICAgICAgIHNjb3BlLnNob3cgPSAnbG9nZ2VkLW91dCc7XG4gICAgICB9KTtcblxuICAgICAgLy8gdXNlciBpcyBhdXRob3JpemVkXG4gICAgICB2YXIgYXV0aG9yaXplZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmF1dGhvcml6ZWQnLCBBY2Nlc3NUb2tlbi5nZXQoKSk7XG4gICAgICAgIHNjb3BlLnNob3cgPSAnbG9nZ2VkLWluJztcbiAgICAgIH07XG5cbiAgICAgIC8vIHNldCB0aGUgb2F1dGggZGlyZWN0aXZlIHRvIHRoZSBsb2dnZWQtb3V0IHN0YXR1c1xuICAgICAgdmFyIGxvZ2dlZE91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmxvZ2dlZE91dCcpO1xuICAgICAgICBzY29wZS5zaG93ID0gJ2xvZ2dlZC1vdXQnO1xuICAgICAgfTtcblxuICAgICAgLy8gc2V0IHRoZSBvYXV0aCBkaXJlY3RpdmUgdG8gdGhlIGRlbmllZCBzdGF0dXNcbiAgICAgIHZhciBkZW5pZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdkZW5pZWQnO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmRlbmllZCcpO1xuICAgICAgfTtcblxuICAgICAgLy8gVXBkYXRlcyB0aGUgdGVtcGxhdGUgYXQgcnVudGltZVxuICAgICAgc2NvcGUuJG9uKCdvYXV0aDp0ZW1wbGF0ZTp1cGRhdGUnLCBmdW5jdGlvbihldmVudCwgdGVtcGxhdGUpIHtcbiAgICAgICAgc2NvcGUudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgY29tcGlsZShzY29wZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gSGFjayB0byB1cGRhdGUgdGhlIGRpcmVjdGl2ZSBjb250ZW50IG9uIGxvZ291dFxuICAgICAgLy8gVE9ETyB0aGluayB0byBhIGNsZWFuZXIgc29sdXRpb25cbiAgICAgIHNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW5pdCgpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZpbml0aW9uO1xuICB9XG5dKTtcbiIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzMxLzE0XG4gKiBAbmFtZSBBUElcbiAqIEBkZXNjIEFQSSBTZXJ2aWNlIGZvciBjb25uZWN0aW5nIHRvIHRoZSBQcm9jZXNzTWFrZXIgMy4wIFJFU1QgQVBJXG4gKi9cbid1c2Ugc3RyaWN0Jztcbi8vU2VydmljZSB0byBtYWtlIEFQSSBjYWxscyB0byB0aGUgUkVTVCBBUElcbi8vV2UgYXJlIHBhc3NpbmcgJGh0dHAgdG8gbWFrZSBhamF4IHJlcXVlc3RzIGFuZCB0aGUgdXJsIGZvciB0aGUgUkVTVCBBUElcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS5cbnNlcnZpY2UoJ0FQSScsIGZ1bmN0aW9uKCRodHRwLCBhcGlfdXJsKXtcbiAgICAvL1dlIGFyZSBkZWZpbmluZyB0aGUgcmVxdWVzdFR5cGUsIHRoaXMgaXMgdGhlIHNwZWNpZmljIGVuZHBvaW50IG9mIHRoZSBSRVNUIEFQSSB3ZSBhcmUgcmVxdWVzdGluZ1xuICAgIC8vUGFyYW1zIGFyZSBhbnkgcGFyYW1ldGVycyB0aGF0IHdlIGFyZSBwYXNzaW5nIGFzIHBhcnQgb2YgYSBwb3N0L3B1dCByZXF1ZXN0XG4gICAgdmFyIHJlcXVlc3RUeXBlLCBwYXJhbXM7XG4gICAgLy9EZWZpbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHNlcnZpY2VcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIGdldFJlcXVlc3RUeXBlXG4gICAgICAgICAqIEBkZXNjIEdldCBtZXRob2QgZm9yIGdldHRpbmcgdGhlIGN1cnJlbnQgcmVxdWVzdCB0eXBlXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0UmVxdWVzdFR5cGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0VHlwZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzZXRSZXF1ZXN0VHlwZVxuICAgICAgICAgKiBAZGVzYyBTZXQgbWV0aG9kIGZvciBzZXR0aW5nIHRoZSBjdXJyZW50IHJlcXVlc3QgdHlwZVxuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICovXG4gICAgICAgIHNldFJlcXVlc3RUeXBlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgcmVxdWVzdFR5cGUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBnZXRQYXJhbXNcbiAgICAgICAgICogQGRlc2MgR2V0IG1ldGhvZCBmb3IgZ2V0dGluZyB0aGUgY3VycmVudCBwYXJhbXNcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRQYXJhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgc2V0UGFyYW1zXG4gICAgICAgICAqIEBkZXNjIFNldCBtZXRob2QgZm9yIHNldHRpbmcgdGhlIGN1cnJlbnQgcGFyYW1zXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0UGFyYW1zOiBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgICBwYXJhbXMgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBuYW1lIHNldFBhcmFtc1xuICAgICAgICAgKiBAZGVzYyBUaGlzIGlzIHRoZSBtYWluIGZ1bmN0aW9uIG9mIHRoZSBzZXJ2aWNlLiBJdCBtYWtlcyBhIGNhbGwgdG8gdGhlIFJFU1QgQVBJXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFjayAtIHJlcXVpcmVkXG4gICAgICAgICAqIEBwYXJhbSByZXF1ZXN0VHlwZSAtIG9wdGlvbmFsXG4gICAgICAgICAqIEBwYXJhbSBtZXRob2QgLSBvcHRpb25hbFxuICAgICAgICAgKi9cbiAgICAgICAgY2FsbDogZnVuY3Rpb24oY2FsbGJhY2ssIG1ldGhvZCwgcmVxdWVzdFR5cGUpe1xuXG4gICAgICAgICAgICAvL0RlZmluZSBvcHRpb25hbCBwYXJhbXMgc28gdGhhdCBvbmx5IGNhbGxiYWNrIG5lZWRzIHRvIGJlIHNwZWNpZmllZCB3aGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gICAgICAgICAgICAvL0Fzc2lnbiBkZWZhdWx0IHZhbHVlIG9nIEdFVCB0byB0aGUgbWV0aG9kIHRoYXQgd2UgYXJlIHJlcXVlc3RpbmdcblxuICAgICAgICAgICAgaWYoIHR5cGVvZiAoIG1ldGhvZCApID09PSAndW5kZWZpbmVkJykgbWV0aG9kID0gJ0dFVCc7XG5cbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSByZXF1ZXN0IHR5cGUgdG8gdGhlIGdldHRlciBtZXRob2QuXG4gICAgICAgICAgICAvL1RoaXMgaXMgdGhlIHdheSB0byB1c2UgdGhlIHNlcnZpY2UuIFNldCB0aGUgc2V0UmVxdWVzdFR5cGUgdG8gdGhlIHVybCBlbmRwb2ludCB5b3Ugd2FudCB0byBoaXRcbiAgICAgICAgICAgIC8vRm9yIGV4YW1wbGUsIGlmIHlvdSB3YW50IGEgbGlzdCBvZiBwcm9qZWN0cy9wcm9jZXNzLCBpbiB5b3VyIGNvbnRyb2xsZXIgZG8gdGhpcyBiZWZvcmUgeW91IGNhbGwgdGhpcyBtZXRob2Q6XG4gICAgICAgICAgICAvL0FQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdHMnKTtcblxuICAgICAgICAgICAgaWYoIHR5cGVvZiAoIHJlcXVlc3RUeXBlICkgPT09ICd1bmRlZmluZWQnKSByZXF1ZXN0VHlwZSA9IHRoaXMuZ2V0UmVxdWVzdFR5cGUoKTtcblxuICAgICAgICAgICAgLy9IYW5kbGUgaWYgdGhlcmUgd2FzIG5vIHJlcXVlc3QgdHlwZSBkZWZpbmVkXG5cbiAgICAgICAgICAgIGlmKCB0eXBlb2YgKCByZXF1ZXN0VHlwZSApID09PSAndW5kZWZpbmVkJykgcmV0dXJuICdJbnZhbGlkIHJlcXVlc3RUeXBlIG9yIG5vIHJlcXVlc3RUeXBlIGRlZmluZWQuJztcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICBTd2l0Y2ggYmFzZWQgb24gbWV0aG9kIHR5cGUgaW4gb3JkZXIgdG8gcmVxdWVzdCB0aGUgcmlnaHQgdHlwZSBvZiBhcGlcbiAgICAgICAgICAgICBEZWZhdWx0IGlzIHRoZSBHRVQgbWV0aG9kLCBiZWNhdXNlIHRoaXMgaXMgdGhlIG1vc3QgY29tbW9uIG1ldGhvZCB1c2VkXG4gICAgICAgICAgICAgQ29udmVydCB0aGUgbWV0aG9kIHRvIHVwcGVyIGNhc2UgZm9yIGNvbnNpc3RlbmN5XG5cbiAgICAgICAgICAgICBGaXJzdCwgd2UgbWFrZSB0aGUgYXBwcm9wcmlhdGUgYWpheCBjYWxsIHdpdGggdGhlIHJlbGV2YW50IGVuZCBwb2ludCBhdHRhY2hlZCB0byBpdFxuICAgICAgICAgICAgIFRoZW4sIHdlIGNoZWNrIGlmIGEgY2FsbGJhY2sgaXMgZGVmaW5lZCwgaWYgc28sIHdlIHJ1biBpdCB3aGlsZSBwYXNzaW5nIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgIGZyb20gdGhlIHNlcnZlciB0byBpdC5cbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICBzd2l0Y2gobWV0aG9kLnRvVXBwZXJDYXNlKCkpe1xuICAgICAgICAgICAgICAgIGNhc2UgJ0dFVCc6XG4gICAgICAgICAgICAgICAgICAgICRodHRwLmdldChhcGlfdXJsK3JlcXVlc3RUeXBlKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrKSBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnUE9TVCc6XG4gICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoYXBpX3VybCtyZXF1ZXN0VHlwZSwgcGFyYW1zKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrKSBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnUFVUJzpcbiAgICAgICAgICAgICAgICAgICAgJGh0dHAucHV0KGFwaV91cmwrcmVxdWVzdFR5cGUsIHBhcmFtcykuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjaykgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIG9yIG5vIG1ldGhvZCBkZWZpbmVkLicpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8zMS8xNFxuICogQG5hbWUgbmdzdG9yYWdlXG4gKiBAZGVzY1xuICovXG4ndXNlIHN0cmljdCc7XG4vKmpzaGludCAtVzAzMCAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2Mgb3ZlcnZpZXdcbiAgICAgKiBAbmFtZSBuZ1N0b3JhZ2VcbiAgICAgKi9cblxuICAgIGFuZ3VsYXIubW9kdWxlKCduZ1N0b3JhZ2UnLCBbXSkuXG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2Mgb2JqZWN0XG4gICAgICogQG5hbWUgbmdTdG9yYWdlLiRsb2NhbFN0b3JhZ2VcbiAgICAgKiBAcmVxdWlyZXMgJHJvb3RTY29wZVxuICAgICAqIEByZXF1aXJlcyAkd2luZG93XG4gICAgICovXG5cbiAgICAgICAgZmFjdG9yeSgnJGxvY2FsU3RvcmFnZScsIF9zdG9yYWdlRmFjdG9yeSgnbG9jYWxTdG9yYWdlJykpLlxuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG9iamVjdFxuICAgICAqIEBuYW1lIG5nU3RvcmFnZS4kc2Vzc2lvblN0b3JhZ2VcbiAgICAgKiBAcmVxdWlyZXMgJHJvb3RTY29wZVxuICAgICAqIEByZXF1aXJlcyAkd2luZG93XG4gICAgICovXG5cbiAgICAgICAgZmFjdG9yeSgnJHNlc3Npb25TdG9yYWdlJywgX3N0b3JhZ2VGYWN0b3J5KCdzZXNzaW9uU3RvcmFnZScpKTtcblxuICAgIGZ1bmN0aW9uIF9zdG9yYWdlRmFjdG9yeShzdG9yYWdlVHlwZSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgJyRyb290U2NvcGUnLFxuICAgICAgICAgICAgJyR3aW5kb3cnLFxuXG4gICAgICAgICAgICBmdW5jdGlvbihcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLFxuICAgICAgICAgICAgICAgICR3aW5kb3dcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgIC8vICM5OiBBc3NpZ24gYSBwbGFjZWhvbGRlciBvYmplY3QgaWYgV2ViIFN0b3JhZ2UgaXMgdW5hdmFpbGFibGUgdG8gcHJldmVudCBicmVha2luZyB0aGUgZW50aXJlIEFuZ3VsYXJKUyBhcHBcbiAgICAgICAgICAgICAgICB2YXIgd2ViU3RvcmFnZSA9ICR3aW5kb3dbc3RvcmFnZVR5cGVdIHx8IChjb25zb2xlLndhcm4oJ1RoaXMgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFdlYiBTdG9yYWdlIScpLCB7fSksXG4gICAgICAgICAgICAgICAgICAgICRzdG9yYWdlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRlZmF1bHQ6IGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmlzRGVmaW5lZCgkc3RvcmFnZVtrXSkgfHwgKCRzdG9yYWdlW2tdID0gaXRlbXNba10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc3RvcmFnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAkcmVzZXQ6IGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiAkc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJCcgPT09IGtbMF0gfHwgZGVsZXRlICRzdG9yYWdlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc3RvcmFnZS4kZGVmYXVsdChpdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF9sYXN0JHN0b3JhZ2UsXG4gICAgICAgICAgICAgICAgICAgIF9kZWJvdW5jZTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBrOyBpIDwgd2ViU3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAvLyAjOCwgIzEwOiBgd2ViU3RvcmFnZS5rZXkoaSlgIG1heSBiZSBhbiBlbXB0eSBzdHJpbmcgKG9yIHRocm93IGFuIGV4Y2VwdGlvbiBpbiBJRTkgaWYgYHdlYlN0b3JhZ2VgIGlzIGVtcHR5KVxuICAgICAgICAgICAgICAgICAgICAoayA9IHdlYlN0b3JhZ2Uua2V5KGkpKSAmJiAnbmdTdG9yYWdlLScgPT09IGsuc2xpY2UoMCwgMTApICYmICgkc3RvcmFnZVtrLnNsaWNlKDEwKV0gPSBhbmd1bGFyLmZyb21Kc29uKHdlYlN0b3JhZ2UuZ2V0SXRlbShrKSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF9sYXN0JHN0b3JhZ2UgPSBhbmd1bGFyLmNvcHkoJHN0b3JhZ2UpO1xuXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIF9kZWJvdW5jZSB8fCAoX2RlYm91bmNlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9kZWJvdW5jZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMoJHN0b3JhZ2UsIF9sYXN0JHN0b3JhZ2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCRzdG9yYWdlLCBmdW5jdGlvbih2LCBrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuaXNEZWZpbmVkKHYpICYmICckJyAhPT0ga1swXSAmJiB3ZWJTdG9yYWdlLnNldEl0ZW0oJ25nU3RvcmFnZS0nICsgaywgYW5ndWxhci50b0pzb24odikpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBfbGFzdCRzdG9yYWdlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBfbGFzdCRzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlYlN0b3JhZ2UucmVtb3ZlSXRlbSgnbmdTdG9yYWdlLScgKyBrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlID0gYW5ndWxhci5jb3B5KCRzdG9yYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwKSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyAjNjogVXNlIGAkd2luZG93LmFkZEV2ZW50TGlzdGVuZXJgIGluc3RlYWQgb2YgYGFuZ3VsYXIuZWxlbWVudGAgdG8gYXZvaWQgdGhlIGpRdWVyeS1zcGVjaWZpYyBgZXZlbnQub3JpZ2luYWxFdmVudGBcbiAgICAgICAgICAgICAgICAnbG9jYWxTdG9yYWdlJyA9PT0gc3RvcmFnZVR5cGUgJiYgJHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICYmICR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgnbmdTdG9yYWdlLScgPT09IGV2ZW50LmtleS5zbGljZSgwLCAxMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50Lm5ld1ZhbHVlID8gJHN0b3JhZ2VbZXZlbnQua2V5LnNsaWNlKDEwKV0gPSBhbmd1bGFyLmZyb21Kc29uKGV2ZW50Lm5ld1ZhbHVlKSA6IGRlbGV0ZSAkc3RvcmFnZVtldmVudC5rZXkuc2xpY2UoMTApXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgX2xhc3Qkc3RvcmFnZSA9IGFuZ3VsYXIuY29weSgkc3RvcmFnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAkc3RvcmFnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbn0pKCk7XG4iLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgRHJhZnRDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBEcmFmdCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdEcmFmdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoQVBJLCAkc2NvcGUpe1xuICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvZHJhZnQnKTtcbiAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiBkcmFmdCBzdGF0dXNcbiAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAvLyNjYXNlcy10YWJsZSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAvL1RoZSBsaXN0IG9mIGNhc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUb2RvIGNyZWF0ZSBzb21lIHR5cGUgb2YgZGlyZWN0aXZlL3NlcnZpY2UgdG8gcmVuZGVyIG1lc3NhZ2VzIGluIHRoZSBhcHBsaWNhdGlvbiB3aXRoIGp1c3QgYSBxdWljayBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICQoJyNjYXNlcy10YWJsZScpLmh0bWwoXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1pbmZvXCI+JytcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JytcbiAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1vayBibHVlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJytcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgRHluYWZvcm1DdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBEeW5hZm9ybVxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdEeW5hZm9ybUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UsIEFQSSkge1xuXG4gICAgICAgIC8vSW5zdGFudGlhdGUgdGhlIGR5bmFmb3JtIG9iamVjdCBzbyB0aGF0IHdlIGNhbiBhc3NpZ24gcHJvcGVydGllcyB0byBpdFxuICAgICAgICAkc2NvcGUuZHluYWZvcm0gPSB7fTtcbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL2FjdGl2aXR5LycrJGxvY2FsU3RvcmFnZS5hY3RfdWlkKycvc3RlcHMnKTtcbiAgICAgICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2Ygc3RlcHNcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgLy9HZXQgdGhlIGZpcnN0IG9iamVjdC9mb3JtIGZvciB0aGUgZGVtbyBhcHBsaWNhdGlvblxuICAgICAgICAgICAgLy9JbiBhIHJlYWwgd29ybGQgZXhhbXBsZSB5b3Ugd291bGQgaGF2ZSB0byBidWlsZCBsb2dpYyBhdCB0aGlzIHBvaW50IHRvXG4gICAgICAgICAgICAvL0Rpc3BsYXkgdGhlIGFwcHJvcHJpYXRlIHN0ZXBzXG4gICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZHluYWZvcm0gdWlkIC8gc3RlcCB1aWQgdG8gbG9jYWxTdG9yYWdlIGZvciBwZXJzaXN0ZW5jZVxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5zdGVwX3VpZF9vYmogPSByZXNwb25zZS5kYXRhWzBdLnN0ZXBfdWlkX29iajtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0LycrJGxvY2FsU3RvcmFnZS5wcm9fdWlkKycvZHluYWZvcm0vJyskbG9jYWxTdG9yYWdlLnN0ZXBfdWlkX29iaik7XG4gICAgICAgICAgICAvL01ha2UgYSBjYWxsIHRvIHRoZSBBUEkgcmVxdWVzdGluZyBkeW5hZm9ybSBkZWZpbml0aW9uIGluIG9yZGVyIHRvIHJlbmRlciB0aGUgZm9ybVxuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHZhciBkeW5hZm9ybUNvbnRlbnQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmRhdGEuZHluX2NvbnRlbnQpO1xuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZHluX3VpZCA9IHJlc3BvbnNlLmRhdGEuZHluX3VpZDtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0ubWFpblRpdGxlID0gcmVzcG9uc2UuZGF0YS5keW5fdGl0bGU7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkcyA9IGR5bmFmb3JtQ29udGVudC5pdGVtc1swXS5pdGVtcztcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0uYXBwX251bWJlciA9ICRsb2NhbFN0b3JhZ2UuYXBwX251bWJlcjtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0uZmllbGRzID0gZmllbGRzO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5zdWJtaXQgPSBmaWVsZHNbZmllbGRzLmxlbmd0aC0xXVswXTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZENhc2VEYXRhKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgc3VibWl0Q2FzZVxuICAgICAgICAgKiBAZGVzYyBTdWJtaXRzIHRoZSBmb3JtIHRvIFByb2Nlc3NNYWtlciB0byBzYXZlIHRoZSBkYXRhIGFuZCB0YWtlcyB0aGUgdXNlciBiYWNrIHRvIHRoZWlyIGluYm94XG4gICAgICAgICAqL1xuXG4gICAgICAgICRzY29wZS5zdWJtaXRDYXNlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSBkZWxlZ2F0aW9uIGluZGV4IGVxdWFsIHRvIDEgaWYgdGhlcmUgaXMgbm8gZGVsZWdhdGlvbiBpbmRleCwgdGhpcyB3b3VsZCBtZWFuIHRoYXQgdGhlIGNhc2UgaXNcbiAgICAgICAgICAgIC8vQ3VycmVudGx5IGluIGRyYWZ0IHN0YXR1cywgb3RoZXJ3aXNlLCBpZiB0aGUgZGVsZWdhdGlvbiBpcyBub3QgbnVsbCwganVzdCBhc3NpZ24gaXQgdmFsdWUgb2YgdGhlIGRlbGVnYXRpb25cbiAgICAgICAgICAgIC8vaW5kZXhcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSAoJGxvY2FsU3RvcmFnZS5kZWxJbmRleCA9PT0gbnVsbCkgPyAxIDogJGxvY2FsU3RvcmFnZS5kZWxJbmRleDtcbiAgICAgICAgICAgIC8vSW5zdGFudGlhdGUgYW4gb2JqZWN0IGluIG9yZGVyIHRvIHVzZSB0byBjcmVhdGUgdGhlIG9iamVjdCB0aGF0IHdlIHdpbGwgYmUgc2VuZGluZyB0byBQcm9jZXNzTWFrZXJcbiAgICAgICAgICAgIC8vSW4gdGhlIC5lYWNoIGxvb3BcbiAgICAgICAgICAgIHZhciBkYXRhT2JqID0ge307XG4gICAgICAgICAgICAvL0hlcmUgd2UgZ2V0IGFsbCB0aGUgaW5wdXQgZWxlbWVudHMgb24gdGhlIGZvcm0gYW5kIHB1dCB0aGVtIGludG8gdGhlIG9iamVjdCBjcmVhdGVkIGFib3ZlXG4gICAgICAgICAgICAvL1RvRG8gc3VwcG9ydCBmb3Igb3RoZXIgZWxlbWVudHMgYmVzaWRlcyBpbnB1dCBlLmcuIHNlbGVjdCwgdGV4dGFyZWEsIHJhZGlvLCBjaGVja1xuICAgICAgICAgICAgJCgnZm9ybScpLmZpbmQoJzppbnB1dCcpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAvL1dlIGZpcnN0IGNoZWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBmaWVsZCBoYXMgYSBwcm9wZXIgaWRcbiAgICAgICAgICAgICAgICAvL1RoZW4gd2UgYXNzaWduIHRvIHRoZSBvYmplY3QgYSBrZXkgb2YgdGhlIGZpZWxkIGlkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaWVsZFxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mKCQodGhpcykuYXR0cignaWQnKSkgIT09ICd1bmRlZmluZWQnICkgZGF0YU9ialskKHRoaXMpLmF0dHIoJ2lkJyldID0gJCh0aGlzKS52YWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrJGxvY2FsU3RvcmFnZS5hcHBfdWlkKycvdmFyaWFibGUnKTtcbiAgICAgICAgICAgIC8vU2V0IHRoZSBwYXJhbXMgZm9yIHRoZSBwdXQgcmVxdWVzdFxuICAgICAgICAgICAgQVBJLnNldFBhcmFtcyhkYXRhT2JqKTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSB0byBzdWJtaXQgdGhlIGRhdGEgdG8gYmUgc2F2ZWQgdG8gdGhlIGNhc2VzIHZhcmlhYmxlc1xuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3BvbnNlIGlzIG5vdCBlcXVhbCB0byAwIHRoYW4gd2Uga25vdyB0aGUgcmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlIT09MCl7XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrJGxvY2FsU3RvcmFnZS5hcHBfdWlkKycvcm91dGUtY2FzZScpO1xuICAgICAgICAgICAgICAgICAgICAvL1NldCB0aGUgcGFyYW1zIGZvciB0aGUgcHV0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgQVBJLnNldFBhcmFtcyh7J2RlbF9pbmRleCc6ICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXgsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04J30pO1xuICAgICAgICAgICAgICAgICAgICAvL01ha2UgYSBjYWxsIHRvIHRoZSBBUEkgdG8gcm91dGUgdGhlIGNhc2UgdG8gdGhlIG5leHQgdGFza1xuICAgICAgICAgICAgICAgICAgICAvL1NvbWV0aGluZyB0byBub3RlIGZvciBwcm9kdWN0aW9uIGVudmlyb25tZW50czpcbiAgICAgICAgICAgICAgICAgICAgLy9UaGlzIHNwZWNpZmljIHdvcmtmbG93IHdhcyBhIHNlcXVlbnRpYWwgd29ya2Zsb3cuIEZvciBwcm9kdWN0aW9uIGVudmlyb25lbW50cyB5b3UgbWF5IG5lZWQgdG8gYWRkXG4gICAgICAgICAgICAgICAgICAgIC8vQ3VzdG9tIGxvZ2ljIGZvciBpbnRlcnByZXRpbmcgdGhlIHJvdXRpbmcgcHJvY2VkdXJlIGZvciBvdGhlciB0eXBlcyBvZiByb3V0aW5nIHJ1bGVzXG4gICAgICAgICAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1Jlc2V0IHRoZSBkZWxlZ2F0aW9uIGluZGV4IHNpbmNlIHdlIGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmRlbEluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVzZXQgdGhlIGFwcGxpY2F0aW9ucyB1bmlxdWUgaWRlbnRpZmllciBzaW5jZSB3ZSBoYXZlIHN1Ym1pdHRlZCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgdXNlciBiYWNrIHRvIHRoZWlyIGhvbWUgaW5ib3ggc2luY2UgdGhleSBoYXZlIHN1Ym1pdHRlZCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL2hvbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vRGlzcGxheSBhIHVzZXIgZnJpZW5kbHkgbWVzc2FnZSB0byB0aGUgdXNlciB0aGF0IHRoZXkgaGF2ZSBzdWNjZXNzZnVsbHkgc3VibWl0dGVkIHRoZSBjYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLm1lc3NhZ2UgPSAnJCRGb3JtU3VibWl0dGVkTWVzc2FnZSQkJztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLy9EZWZpbmUgdGhlIHJlcXVlc3QgdHlwZSwgaW4gdGhpcyBjYXNlLCBQVVRcbiAgICAgICAgICAgICAgICAgICAgJ1BVVCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBVVFxuICAgICAgICAgICAgJ1BVVCcpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIGxvYWRDYXNlRGF0YVxuICAgICAgICAgKiBAZGVzYyBMb2FkcyB0aGUgZGF0YSBmcm9tIHRoZSBjYXNlIGFuZCBwb3B1bGF0ZXMgdGhlIGZvcm0gd2l0aCBpdFxuICAgICAgICAgKi9cbiAgICAgICAgJHNjb3BlLmxvYWRDYXNlRGF0YSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJyskbG9jYWxTdG9yYWdlLmFwcF91aWQrJy92YXJpYWJsZXMnKTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSByZXF1ZXN0aW5nIHRoZSBkYXRhIG9mIHRoZSBjYXNlXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGlzIGdyZWF0ZXIgdGhhbiAwLCB3ZSBrbm93IHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICAgICAgaWYoJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIHJlc3BvbnNlIHRvIGEgdmFyaWFibGUgZm9yIGVhc2llciB1c2VcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAvL0xvb3AgdGhyb3VnaCBhbGwgdGhlIGlucHV0IGVsZW1lbnRzIG9uIHRoZSBmb3JtIGFuZCBwb3B1bGF0ZSB0aGVtIHdpdGggdGhlIGRhdGEgcmV0cmlldmVkIGZyb20gdGhlIEFQSVxuICAgICAgICAgICAgICAgICAgICAvL1RvRG8gc3VwcG9ydCBmb3Igb3RoZXIgZWxlbWVudHMgYmVzaWRlcyBpbnB1dCBlLmcuIHNlbGVjdCwgdGV4dGFyZWEsIHJhZGlvLCBjaGVja1xuICAgICAgICAgICAgICAgICAgICAkKCdmb3JtJykuZmluZCgnOmlucHV0JykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9XZSBmaXJzdCBjaGVjayB0byBtYWtlIHN1cmUgdGhhdCB0aGUgZmllbGQgaGFzIGEgcHJvcGVyIGlkXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1RoZW4gd2UgYXNzaWduIHRvIHRoZSBmaWVsZCdzIHZhbHVlIHdpdGggdGhlIGFzc29jaWF0ZWQgZmllbGQgcmV0dXJuZWQgZnJvbSB0aGUgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZigkKHRoaXMpLmF0dHIoJ2lkJykpICE9PSAndW5kZWZpbmVkJyApICQodGhpcykudmFsKGRhdGFbJCh0aGlzKS5hdHRyKCdpZCcpXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIEhvbWVDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBIb21lIHBhZ2VcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYWxTdG9yYWdlKXtcbiAgICAvL0NoZWNrIGlmIGxvY2FsU3RvcmFnZSBoYXMgYSBtZXNzYWdlIHRvIGRpc3BsYXlcbiAgICBpZiAoICRsb2NhbFN0b3JhZ2UubWVzc2FnZSApe1xuICAgICAgICAvL1NldCB0aGUgbmV3TWVzc2FnZSB0byB0cnVlIHNvIHRoYXQgaXQgd2lsbCBzaG93IG9uIHRoZSBob21lIHBhZ2VcbiAgICAgICAgJHNjb3BlLm5ld01lc3NhZ2UgPSB0cnVlO1xuICAgICAgICAvL1NldCB0aGUgbWVzc2FnZSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGluIHRoZSB2aWV3XG4gICAgICAgICRzY29wZS5XZWxjb21lTWVzc2FnZSA9ICRsb2NhbFN0b3JhZ2UubWVzc2FnZTtcbiAgICB9ZWxzZXtcbiAgICAgICAgLy9ObyBtZXNzYWdlIGluIHRoZSBsb2NhbFN0b3JhZ2UsIHNvIHNldCBuZXdNZXNzYWdlIHRvIGZhbHNlXG4gICAgICAgICRzY29wZS5uZXdNZXNzYWdlID0gZmFsc2U7XG4gICAgICAgIC8vRGlzcGxheSB0aGUgZGVmYXVsdCBtZXNzYWdlXG4gICAgICAgICRzY29wZS5XZWxjb21lTWVzc2FnZSA9ICckJFdlbGNvbWVNZXNzYWdlJCQnO1xuICAgIH1cbiAgICAvL0Rlc3RvcnkgdGhlIG1lc3NhZ2UgaW4gdGhlIGxvY2FsU3RvcmFnZSBub3cgdGhhdCB3ZSBoYXZlIGRpc3BsYXllZCBpdCBpbiB0aGUgc2NvcGVcbiAgICAkbG9jYWxTdG9yYWdlLm1lc3NhZ2UgPSBudWxsO1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIEluYm94Q3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgSW5ib3ggcGFnZVxuICovXG4vKiBnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignSW5ib3hDb250cm9sbGVyJywgZnVuY3Rpb24gKEFQSSwgJHNjb3BlKXtcbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIGNvbnNvbGUubG9nKCdoZXJlJyk7XG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMnKTtcbiAgICAgICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2YgY2FzZXMgaW4gVG8gRG8gc3RhdHVzXG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5odG1sKFxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLW9rIGJsdWVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgTmV3Y2FzZUN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIE5ldyBDYXNlIHBhZ2VcbiAqL1xuLypnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignTmV3Y2FzZUNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCBBUEkpe1xuICAgICAgICAvL0Fzc2lnbiB0aGUgbGlzdCBvZiBzdGFydGluZyB0YXNrcyBmcm9tIGxvY2FsU3RvcmFnZSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGluIHRoZSB2aWV3XG4gICAgICAgICRzY29wZS50YXNrTGlzdCA9ICRsb2NhbFN0b3JhZ2Uuc3RhcnRpbmdUYXNrcztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzdGFydENhc2VcbiAgICAgICAgICogQGRlc2MgU3RhcnRzIGEgbmV3IGNhc2UgaW4gUHJvY2Vzc01ha2VyXG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUuc3RhcnRDYXNlID0gZnVuY3Rpb24oYWN0X3VpZCl7XG4gICAgICAgICAgICAvL1NldHRpbmcgdGhlIGFjdGl2aXR5IHVpZCB0byBsb2NhbFN0b3JhZ2UgZm9yIGxhdGVyIHVzZVxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hY3RfdWlkID0gYWN0X3VpZDtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcycpO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHBvc3QgcmVxdWVzdFxuICAgICAgICAgICAgQVBJLnNldFBhcmFtcyh7cHJvX3VpZDogJGxvY2FsU3RvcmFnZS5wcm9fdWlkLCB0YXNfdWlkOiAkbG9jYWxTdG9yYWdlLmFjdF91aWR9KTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIFJFU1QgQVBJIHRvIHN0YXJ0IGEgY2FzZVxuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaXMgZ3JlYXRlciB0aGFuIDAsIHRoZW4gd2Uga25vdyB3ZSdyZSBpbiBidXNpbmVzcyFcbiAgICAgICAgICAgICAgICBpZiggJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwICl7XG4gICAgICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgdXNlciB0byB0aGUgb3BlbmNhc2UgcGFnZSwgdGhlcmUgd2UgZGlzcGxheSB0aGUgZHluYWZvcm1cbiAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL29wZW5jYXNlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IHRoZSBsb2NhbFN0b3JhZ2UgYXBwbGljYXRpb24gdW5pcXVlIGlkZW50aWZpZXIgdG8gdGhhdCB3aGljaCB3YXMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX3VpZCA9IHJlc3BvbnNlLmRhdGEuYXBwX3VpZDtcbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIGxvY2FsU3RvcmFnZSBhcHBsaWNhdGlvbiBudW1iZXIgdG8gdGhhdCB3aGljaCB3YXMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX251bWJlciA9IHJlc3BvbnNlLmRhdGEuYXBwX251bWJlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9EZWZpbmUgdGhlIHJlcXVlc3QgdHlwZSwgaW4gdGhpcyBjYXNlLCBQT1NUXG4gICAgICAgICAgICAnUE9TVCcpO1xuICAgICAgICB9O1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIE5ld3Byb2Nlc3NDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBOZXcgUHJvY2VzcyBQYWdlXG4gKi9cbi8qZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ05ld3Byb2Nlc3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgJGxvY2FsU3RvcmFnZSwgQVBJKXtcbiAgICAgICAgJHNjb3BlLmdldFByb2Nlc3NMaXN0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0Jyk7XG4gICAgICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBhdmFpbGFibGUgcHJvY2Vzc2VzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlXG4gICAgICAgICAgICAgICAgLy9DYW4gcmVuZGVyIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgJHNjb3BlLnByb0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgICAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgICAgICAgICBpZigkc2NvcGUucHJvTGlzdC5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgICAgICAgICAgLy8jbmV3LXByb2Nlc3MtYXJlYSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgcHJvY2Vzc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAkKCcjbmV3LXByb2Nlc3MtYXJlYScpLmh0bWwoJyQkTm9Qcm9jZXNzZXNUb0Rpc3BsYXlNZXNzYWdlJCQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0oKTsvL1dlIGF1dG8gaW5zdGFudGlhdGUgdGhlIG1ldGhvZCBpbiBvcmRlciB0byBoYXZlIGl0IGdldCB0aGUgaW5mb3JtYXRpb24gZnJvbSB0aGUgQVBJIGFuZCBkaXNwbGF5IG9uIGxvYWQgb2YgdGhlIGNvbnRyb2xsZXJcblxuICAgICAgICAvL1RoaXMgbWV0aG9kIHN0YXJ0cyBhIHByb2Nlc3MgYW5kIGdldHMgdGhlIGFzc29jaWF0ZWQgc3RhcnRpbmcgdGFza3Mgb2YgdGhlIHByb2Nlc3MgYW5kIGRpc3BsYXlzIHRoZW1cbiAgICAgICAgLy9JdCB0YWtlcyBvbmUgcGFyYW0sIHRoZSBwcm9jZXNzIHVuaXF1ZSBpZGVudGlmaWVyIHRoYXQgd2Ugd2FudCB0byBzdGFydFxuICAgICAgICAkc2NvcGUuc3RhcnRQcm9jZXNzID0gZnVuY3Rpb24ocHJvX3VpZCl7XG4gICAgICAgICAgICAvL1NldHRpbmcgdGhlIHByb2Nlc3MgdWlkIHRvIGxvY2FsU3RvcmFnZSBmb3IgbGF0ZXIgdXNlXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnByb191aWQgPSBwcm9fdWlkO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3QvJyskbG9jYWxTdG9yYWdlLnByb191aWQrJy9zdGFydGluZy10YXNrcycpO1xuICAgICAgICAgICAgLy9DYWxsIHRvIHRoZSBSRVNUIEFQSSB0byBsaXN0IGFsbCBhdmFpbGFibGUgc3RhcnRpbmcgdGFza3MgZm9yIHRoZSBzcGVjaWZpZWQgcHJvY2Vzc1xuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgbGlzdCBvZiBuZXcgY2FzZXMgdG8gbG9jYWxTdG9yYWdlIHNvIHRoYXQgdGhlIE5ld2Nhc2VDdHJsIGNvbnRyb2xsZXIgY2FuIHVzZSBpdFxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2Uuc3RhcnRpbmdUYXNrcyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgLy9DaGFuZ2UgdGhlIHVybCBzbyB0aGF0IHRoZSBuZXcgY2FzZSBwYWdlIGlzIGRpc3BsYXllZFxuICAgICAgICAgICAgICAgICRsb2NhdGlvbi51cmwoJy9uZXdjYXNlJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgUGFydGljaXBhdGVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgUGFydGljaXBhdGVkIHBhZ2VcbiAqL1xuLyogZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ1BhcnRpY2lwYXRlZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBBUEkpIHtcbiAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzL3BhcnRpY2lwYXRlZCcpO1xuICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIHBhcnRpY2lwYXRlZCBzdGF0dXNcbiAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJCgnI2Nhc2VzLXRhYmxlJykuaHRtbChcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+JytcbiAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tb2sgYmx1ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJytcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIFJvb3RDdHJsXG4gKiBAZGVzYyBUaGlzIGlzIHRoZSByb290IGNvbnRyb2xsZXIuIEl0IGNvbnRyb2xzIGFzcGVjdHMgcmVsYXRlZCB0byB0aGUgYXBwbGljYXRpb24gZnJvbSBhIGhpZ2hlciBsZXZlbFxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdSb290Q29udHJvbGxlcicsIGZ1bmN0aW9uIFJvb3RDdHJsKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCAkc3RhdGUsICRodHRwLCBBUEksIGFwcFRpdGxlLCBnZW5lcmljSGVhZGVycywgYWN0aXZlTWVudUl0ZW1zLCBhcGlfdXJsLCBBY2Nlc3NUb2tlbil7XG4gICAgLy9EZWZpbmUgdGhlIGNvbHVtbiBuYW1lcyBmb3IgdGhlIGdyaWRzLiBJbiB0aGlzIGNhc2UsIHdlIGFyZSBjcmVhdGluZyBnbG9iYWwgY29sdW1ucywgYnV0IHlvdSBjb3VsZCBqdXN0IHJlZGVmaW5lIHRoaXMgYXJyYXkgb24gYW55IGNvbnRyb2xsZXJcbiAgICAvL1RvIG92ZXJ3cml0ZSB0aGVtIGZvciBhIHNwZWNpZmljIHBhZ2VcbiAgICAkc2NvcGUuZ3JpZEhlYWRlcnMgPSBnZW5lcmljSGVhZGVycztcbiAgICAvL0RlZmluZSB0aGUgYXBwbGljYXRpb24gdGl0bGUgYW5kIHNldCBpdCB0byB0aGUgc2NvcGUgc28gdGhhdCB0aGUgdmlldyByZW5kZXJzIGl0XG4gICAgJHNjb3BlLmFwcFRpdGxlID0gYXBwVGl0bGU7XG4gICAgLy9UaGlzIGZ1bmN0aW9uIHNldHMgdGhlIHNpZGViYXIgbWVudSB0byBhY3RpdmUgYmFzZWQgb24gdGhlIHBhZ2Ugc2VsZWN0ZWRcbiAgICAkc2NvcGUuc2V0U2VsZWN0ZWRQYWdlID0gZnVuY3Rpb24oY3VycmVudFBhZ2Upe1xuICAgICAgICAvL0xpc3Qgb2YgYWxsIHRoZSBtZW51IGl0ZW1zIHNvIHRoYXQgd2UgY2FuIGxvb3AgdGhyb3VnaCB0aGVtXG4gICAgICAgIHZhciBsaXN0ID0gYWN0aXZlTWVudUl0ZW1zO1xuICAgICAgICAvL0xvb3AgdGhyb3VnaCBhbGwgdGhlIG1lbnUgaXRlbXNcbiAgICAgICAgJC5lYWNoKGxpc3QsIGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICAgICAgICAgICAgLy9DaGVjayBpZiB0aGUgY3VycmVudCBwYWdlIGlzIGVxdWFsIGEga2V5XG4gICAgICAgICAgICAvL0lmIGl0IGlzLCBtYWtlIGl0IGFjdGl2ZVxuICAgICAgICAgICAgaWYoY3VycmVudFBhZ2UgPT09IGtleSkgJHNjb3BlW3ZhbHVlXSA9ICdhY3RpdmUnO1xuICAgICAgICAgICAgLy9PdGhlcndpc2UsIG1ha2UgdGhlIHJlc3Qgb2YgdGhlbSBpbmFjdGl2ZSBzbyBvbmx5IHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZSBpcyBkaXNwbGF5ZWQgYXMgYWN0aXZlXG4gICAgICAgICAgICBlbHNlICRzY29wZVt2YWx1ZV0gPSAnJztcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuYW1lICEhIUV2ZW50cyEhIVxuICAgICAgICAgKiBAZGVzYyBUaGlzIGlzIHdoZXJlIHdlIHdpbGwgZGVmaW5lIGEgYnVuY2ggb2YgZXZlbnRzIGFuZCB3aGF0IGhhcHBlbnMgZHVyaW5nIHRob3NlIGV2ZW50c1xuICAgICAgICAgKiBAZGVzYyBGdW4gc3R1ZmYhISEhXG4gICAgICAgICAqL1xuICAgIC8vV2hlbiB0aGUgYXBwbGljYXRpb25zIHN0YXRlIGhhcyBjaGFuZ2VkIHRvIGFub3RoZXIgcm91dGUsIHdlIHdhbnQgdG8gZmlyZSBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKXtcbiAgICAgICAgLy9DaGFuZ2UgdGhlIG1lbnUgaXRlbSBzZWxlY3RlZCBhcyBhY3RpdmUgd2hlbmV2ZXIgdGhlIHBhZ2UgaXMgY2hhbmdlZFxuICAgICAgICAkc2NvcGUuc2V0U2VsZWN0ZWRQYWdlKHRvU3RhdGUuY3VycmVudFBhZ2UpO1xuICAgICAgICAvL1NldCB0aGUgY3VycmVudCBwYWdlcyBuYW1lIHRvIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gdG9TdGF0ZS5jdXJyZW50UGFnZTtcbiAgICAgICAgLy9TZXQgdGhlIGN1cnJlbnQgcGFnZXMgZGVzY3JpcHRpb24gdG8gdGhlIGN1cnJlbnQgcGFnZXMgZGVzY3JpcHRpb25cbiAgICAgICAgJHNjb3BlLnBhZ2VEZXNjID0gdG9TdGF0ZS5wYWdlRGVzYztcbiAgICAgICAgLy9XZSB3YW50IHRvIGRlc3Ryb3kgdGhlIGRlbGVnYXRpb24gaW5kZXggaWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3QgYSBkeW5hZm9ybSBzbyB0aGF0IHRoZSBuZXh0IHRpbWVcbiAgICAgICAgLy9XZSBsb2FkIGEgcGFnZSwgaXQgZG9lcyBub3QgdXNlIGEgZGVsZWdhdGlvbiBpbmRleCBvZiBhIGRpZmZlcmVudCBhcHBsaWNhdGlvblxuICAgICAgICBpZigkc2NvcGUuY3VycmVudFBhZ2UgIT09ICdEeW5hZm9ybScpICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBudWxsO1xuICAgICAgICAvL0R1cmluZyB0aGUgYXV0aGVudGljYXRpb24gcHJvY2VzcyB0aGUgaHR0cCBoZWFkZXJzIGNvdWxkIGhhdmUgY2hhbmdlZCB0byBCYXNpY1xuICAgICAgICAvL1NvIHdlIGp1c3QgcmVpbmZvcmNlIHRoZSBoZWFkZXJzIHdpdGggdGhlIEJlYXJlciBhdXRob3JpemF0aW9uIGFzIHdlbGwgYXMgdGhlIHVwZGF0ZWQgYWNjZXNzX3Rva2VuXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLkF1dGhvcml6YXRpb24gPSAnQmVhcmVyICcgKyAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuO1xuICAgIH0pO1xuICAgIC8vV2hlbiB0aGUgdXNlciBsb2dzIGluLCB3ZSBkbyBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHJvb3RTY29wZS4kb24oJ29hdXRoOmxvZ2luJywgZnVuY3Rpb24oZXZlbnQsIHRva2VuKXtcbiAgICAgICAgLy9UaGlzIGlzIEVYVFJFTUVMWSBpbXBvcnRhbnQgLSBUaGUgd2hvbGUgVUkgaXMgcmVuZGVyZWQgYmFzZWQgb24gaWYgdGhpcyBpcyBhbiBhY2Nlc190b2tlblxuICAgICAgICAvL1NvLCB3ZSBhc3NpZ24gdGhlIHNjb3BlcyBhY2Nlc3NUb2tlbiB0byB0aGUgdG9rZW5cbiAgICAgICAgLy9JZiB0aGUgdXNlciBpcyBub3QgbG9nZ2VkIGluLCB0aGUgdG9rZW4gb2JqZWN0IHdpbGwgYmUgdW5kZWZpbmVkXG4gICAgICAgIC8vSWYgdGhlIHVzZXIgSVMgbG9nZ2VkIGluLCB0aGUgdG9rZW4gb2JqZWN0IHdpbGwgaG9sZCB0aGUgdG9rZW4gaW5mb3JtYXRpb25cbiAgICAgICAgLy9FLmcuIGFjY2Vzc190b2tlbiwgcmVmcmVzaF90b2tlbiwgZXhwaXJ5IGV0Y1xuICAgICAgICAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuID0gdG9rZW4uYWNjZXNzX3Rva2VuO1xuICAgIH0pO1xuICAgICRyb290U2NvcGUuJG9uKCdvYXV0aDpsb2dnZWRPdXQnLCBmdW5jdGlvbihldmVudCwgdG9rZW4pe1xuICAgICAgICAvL1RoZSB1c2VyIGhhcyBsb2dnZWQgb3V0LCBzbyB3ZSBkZXN0cm95IHRoZSBhY2Nlc3NfdG9rZW5cbiAgICAgICAgLy9CZWNhdXNlIG9mIEFuZ3VsYXJzIGF3ZXNvbWUgbGl2ZSBkYXRhIGJpbmRpbmcsIHRoaXMgYXV0b21hdGljYWxseSByZW5kZXJzIHRoZSB2aWV3IGlubmF0ZVxuICAgICAgICAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuID0gbnVsbDtcbiAgICAgICAgLy9EZXN0b3J5IHRoZSBBY2Nlc3NUb2tlbiBvYmplY3RcbiAgICAgICAgQWNjZXNzVG9rZW4uZGVzdHJveSgpO1xuICAgICAgICAvL1NldCB0aGUgcGFnZXMgbmFtZSB0byBhbiB1bmF1dGhvcml6ZWQgbWVzc2FnZVxuICAgICAgICAkc2NvcGUuY3VycmVudFBhZ2UgPSAnUGxlYXNlIExvZ2luLic7XG4gICAgICAgIC8vU2V0IHRoZSBwYWdlcyBkZXNjcmlwdGlvbiB0byBhbiB1bmF1dGhvcml6ZWQgbWVzc2FnZVxuICAgICAgICAkc2NvcGUucGFnZURlc2MgPSAnJCREZWZhdWx0V2VsY29tZU1lc3NhZ2UkJCc7XG4gICAgICAgIC8vUmVkaXJlY3QgdGhlIHVzZXIgYmFjayB0byB0aGUgaG9tZSBwYWdlXG4gICAgICAgICRzdGF0ZS5nbygnYXBwLmhvbWUnKTtcbiAgICB9KTtcbiAgICAvL1doZW4gdGhlIHVzZXIgbG9ncyBvdXQsIHdlIGRvIHNvbWUgdGhpbmdzIG9uIHRoaXMgZXZlbnRcbiAgICAkcm9vdFNjb3BlLiRvbignb2F1dGg6bG9nb3V0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgLy9UaGUgdXNlciBoYXMgbG9nZ2VkIG91dCwgc28gd2UgZGVzdHJveSB0aGUgYWNjZXNzX3Rva2VuXG4gICAgICAgIC8vQmVjYXVzZSBvZiBBbmd1bGFycyBhd2Vzb21lIGxpdmUgZGF0YSBiaW5kaW5nLCB0aGlzIGF1dG9tYXRpY2FsbHkgcmVuZGVycyB0aGUgdmlldyBpbm5hdGVcbiAgICAgICAgJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbiA9IG51bGw7XG4gICAgICAgIC8vRGVzdG9yeSB0aGUgQWNjZXNzVG9rZW4gb2JqZWN0XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koKTtcbiAgICAgICAgLy9TZXQgdGhlIHBhZ2VzIG5hbWUgdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gJ1BsZWFzZSBMb2dpbi4nO1xuICAgICAgICAvL1NldCB0aGUgcGFnZXMgZGVzY3JpcHRpb24gdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLnBhZ2VEZXNjID0gJyQkRGVmYXVsdFdlbGNvbWVNZXNzYWdlJCQnO1xuICAgICAgICAvL1JlZGlyZWN0IHRoZSB1c2VyIGJhY2sgdG8gdGhlIGhvbWUgcGFnZVxuICAgICAgICAkc3RhdGUuZ28oJ2FwcC5ob21lJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgKiBAbmFtZSBvcGVuQ2FzZVxuICAgICAqIEBkZXNjIE9wZW5zIGEgZHluYWZvcm0gYW5kIGRpc3BsYXlzIHRoZSBkYXRhIGZvciB0aGUgdXNlclxuICAgICAqIEBwYXJhbSBhcHBfdWlkIC0gcmVxdWlyZWQgLSB0aGUgYXBwbGljYXRpb24gdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBjYXNlIHlvdSB3aXNoIHRvIG9wZW5cbiAgICAgKiBAcGFyYW0gZGVsSW5kZXggLSByZXF1aXJlZCAtIHRoZSBkZWxlZ2F0aW9uIGluZGV4IG9mIHRoZSBjdXJyZW50IGFwcGxpY2F0aW9uIHRoYXQgeW91IGFyZSBvcGVuaW5nXG4gICAgICovXG4gICAgJHNjb3BlLm9wZW5DYXNlID0gZnVuY3Rpb24oYXBwX3VpZCwgZGVsSW5kZXgpe1xuICAgICAgICAvL0hpZGUgdGhlIHZpZXcgb2YgdGhlIGNhc2VzIGxpc3Qgc28gdGhhdCB3ZSBjYW4gZGlzcGxheSB0aGUgZm9ybVxuICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5oaWRlKCk7XG4gICAgICAgIC8vU2hvdyB0aGUgdmlldyBvZiB0aGUgZm9ybVxuICAgICAgICAkKCcjZm9ybS1hcmVhJykuc2hvdygpO1xuICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrYXBwX3VpZCk7XG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIGlmKCAkKHJlc3BvbnNlLmRhdGEpLnNpemUoKSA+IDAgKXtcbiAgICAgICAgICAgICAgICAvL0Fzc2lnbiB0aGUgbG9jYWxTdG9yYWdlIGRhdGE6XG4gICAgICAgICAgICAgICAgLy9UaGUgYXBwbGljYXRpb25zIG51bWJlclxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX251bWJlciA9IHJlc3BvbnNlLmRhdGEuYXBwX251bWJlcjtcbiAgICAgICAgICAgICAgICAvL1RoZSBwcm9jZXNzIHVuaXF1ZSBpZGVudGlmaWVyIHRoYXQgdGhlIGNhc2UgaXMgYXNzb2NpYXRlZCB0b1xuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UucHJvX3VpZCA9IHJlc3BvbnNlLmRhdGEucHJvX3VpZDtcbiAgICAgICAgICAgICAgICAvL1RoZSBhY3Rpdml0eS9mb3JtIHVuaXF1ZSBpZGVudGlmaWVyIHRoYXQgd2UgYXJlIGdvaW5nIHRvIGRpc3BhbHlcbiAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFjdF91aWQgPSByZXNwb25zZS5kYXRhLmN1cnJlbnRfdGFza1swXS50YXNfdWlkO1xuICAgICAgICAgICAgICAgIC8vVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX3VpZCA9IGFwcF91aWQ7XG4gICAgICAgICAgICAgICAgLy9UaGUgZGVsZWdhdGlvbiBpbmRleCBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmRlbEluZGV4ID0gZGVsSW5kZXg7XG4gICAgICAgICAgICAgICAgLy9SZWRpcmVjdCB0aGUgdXNlciB0byB0aGUgb3BlbmNhc2UgZm9ybSB3aGVyZSB3ZSB3aWxsIGRpc3BsYXkgdGhlIGR5bmFmb3JtXG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9vcGVuY2FzZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCRsb2NhbFN0b3JhZ2UuYWNjZXNzVG9rZW4gJiYgJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbi5sZW5ndGggPiAxKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgVW5hc3NpZ25lZEN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIFVuYXNzaWduZWQgcGFnZVxuICovXG4vKiBnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignVW5hc3NpZ25lZENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBBUEkpIHtcbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvdW5hc3NpZ25lZCcpO1xuICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiB1bmFzc2lnbmVkIHN0YXR1c1xuICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZGF0YSByZWNlaXZlZCBmcm9tIHRoZSBBUEkgdG8gdGhlIHNjb3BlIHNvIHRoYXQgd2UgY2FuIHJlbmRlciB0aGUgdmlldyB3aXRoIHRoZSBkYXRhXG4gICAgICAgICAgICAkc2NvcGUuY2FzZXNMaXN0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgICAgICAvL01lc3NhZ2Ugc3RhdGluZyB0aGF0IHRoZXJlIGlzIG5vdGhpbmcgdG8gZGlzcGxheVxuICAgICAgICAgICAgaWYoJHNjb3BlLmNhc2VzTGlzdC5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUb2RvIGNyZWF0ZSBzb21lIHR5cGUgb2YgZGlyZWN0aXZlL3NlcnZpY2UgdG8gcmVuZGVyIG1lc3NhZ2VzIGluIHRoZSBhcHBsaWNhdGlvbiB3aXRoIGp1c3QgYSBxdWljayBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgJCgnI2Nhc2VzLXRhYmxlJykuaHRtbChcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1pbmZvXCI+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1vayBibHVlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJytcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=