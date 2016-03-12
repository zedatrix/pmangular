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
//Service to provide helper functions to be reused across multiple classes/files
angular.module('pmAngular').
service('Helpers', function(){
    return {
        showMessageArea: function(id, msg, debug){
            debug = (angular.isUndefined(debug))? false : debug;
            if(debug) console.log("ID: "+id+"\n\r"+"Message: "+msg);
            $(id).html(
                '<div class="alert alert-block alert-info">'+
                '<button type="button" class="close" data-dismiss="alert">'+
                '<i class="icon-remove"></i>'+
                '</button>'+
                '<p><i class="icon-ok blue"></i> '+
                msg+
                    '</p></div>'
            );
        }
    };
});
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
        call: function(callback, method, requestType, errHandler){

            //Define optional params so that only callback needs to be specified when this function is called
            //Assign default value og GET to the method that we are requesting

            method = (angular.isUndefined(method))? 'GET' : method;

            //Assign the default value of the request type to the getter method.
            //This is the way to use the service. Set the setRequestType to the url endpoint you want to hit
            //For example, if you want a list of projects/process, in your controller do this before you call this method:
            //API.setRequestType('projects');

            if( angular.isUndefined(requestType)){
                requestType = this.getRequestType();
                //Handle if there was no request type defined
                if(angular.isUndefined(requestType)) return 'No request type defined.';

            }

            errHandler = (angular.isUndefined(errHandler))?function(){} : errHandler;

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
                        }).catch(errHandler);
                    break;
                case 'POST':
                    $http.post(api_url+requestType, params).
                        then(function(response){
                            if(callback) callback(response);
                        }).catch(errHandler);
                    break;
                case 'PUT':
                    $http.put(api_url+requestType, params).
                        then(function(response){
                            if(callback) callback(response);
                        }).catch(errHandler);
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
 * @date 7/31/14
 * @name API
 * @desc API Service for connecting to the ProcessMaker 3.0 REST API
 */
'use strict';
//Service to pass user interface messages
angular.module('pmAngular').
service('Message', function($localStorage){
    //Define the functionality of the service
    $localStorage.message = {
        text: '',
        type: ''
    };
    return {
        /**
         * @author ethan@colosa.com
         * @name getMessageType
         * @desc Get method for getting the current request type
         * @returns {*}
         */
        getMessageType: function () {
            return $localStorage.message.type;
        },
        /**
         * @author ethan@colosa.com
         * @name setMessageType
         * @desc Set method for setting the current request type
         * @param value
         */
        setMessageType: function(value) {
            $localStorage.message.type = value;
        },
        /**
         * @author ethan@colosa.com
         * @name getMessageText
         * @desc Get method for getting the current messageText
         * @returns {*}
         */
        getMessageText: function(){
            return $localStorage.message.text;
        },

        /**
         * @author ethan@colosa.com
         * @name setMessageText
         * @desc Set method for setting the current messageText
         * @param value
         */
        setMessageText: function(value){
            $localStorage.message.text = value;
        },
        /**
         * @author ethan@colosa.com
         * @name destroyMessage
         * @desc Destroy method for destroying the current message
         * @param value
         */
        destroyMessage: function(){
            $localStorage.message.text = null;
            $localStorage.message.type = null;
        },
        /**
         * @author ethan@colosa.com
         * @name sendMessage
         * @desc Method for broadcasting the current message
         * @param value
         */
        sendMessage: function(){

        }
    };
});
'use strict';
//Service to handle displaying user messages
angular.module('pmAngular').
directive('userMessage', function(Message) {
    return {
        restrict: 'E',
        scope: {
            text: '=text',
            type: '=type'
        },
        link: function (scope, element, attrs) {
            //console.log(Message.getMessageText());
            scope.text = Message.getMessageText();
            scope.type = Message.getMessageType();
        },
        templateUrl: 'views/message/message.html'

    };
});
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

        //Assign the data received from the API to the scope so that we can render the view with the data
        try{
            API.call(function(response){
                $scope.casesList = response.data;
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if($scope.casesList.length===0){
                    //#cases-table is the area on the page we are rendering
                    //The list of cases, so we are setting it's HTML equal to the display message
                    Helpers.showMessageArea('#cases-table',
                        'There are no cases to display. Please choose another folder.', true);
                }
            });
        }catch(e){
            Helpers.showMessageArea('#cases-table',
                'There has been a problem with your request. Please try again later.'+
                '\n'+
                '</p><p>'+
                'Error Message: <pre>'+ JSON.stringify(e, null, '\t')+
                '</pre></p>', true);
        }


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
    .controller('DynaformController', function ($scope, $location, $state, $localStorage, API, Message, Helpers) {

        //Instantiate the dynaform object so that we can assign properties to it
        $scope.dynaform = {};

        //Set the requestType
        API.setRequestType('project/'+$localStorage.pro_uid+'/activity/'+$localStorage.act_uid+'/steps');
        //Make the API call to get the list of steps
        API.call(function(response){
            //Get the first object/form for the demo application
            //In a real world example you would have to build logic at this point to
            //Check if there is a form associated with this step
            if( ! response.data.length > 0 ){
                Message.setMessageType('danger');
                Message.setMessageText('There is no step to display. This is likely due to a faulty process design.');
                return $state.go('app.home');

            }
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
            }, 'GET', undefined, function(e){
                Helpers.showMessageArea('#start-case-area',
                    'There has been a problem with your request. Please try again later.'+
                    '</p><p>'+
                    'Error Message: <pre>'+ JSON.stringify(e, null, '\t')+
                    '</pre></p>', true);
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
            //Set the requestType
            API.setRequestType('cases/'+$localStorage.app_uid+'/variable');
            //Set the params for the put request
            API.setParams($scope.fieldData);
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
                                Message.setMessageText('Case submitted successfully!');
                                Message.setMessageType('success');
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
                    $scope.fieldData = response.data;
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
.controller('HomeController', function ($scope, $localStorage, Message){
    //Check if user is logged in
    if( ! $scope.authenticated() ){
        //Display the default message
        Message.setMessageText('Welcome to pmAngular. You need to log in with your ProcessMaker account in order to continue.');
        Message.setMessageType('warning');
        return;
    }
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
        API.setRequestType('cases');
        //Make the API call to get the list of cases in To Do status
        API.call(function(response){
            //Assign the data received from the API to the scope so that we can render the view with the data
            $scope.casesList = response.data;
            //If the resulting data length is equal to 0, then we display a user friendly
            //Message stating that there is nothing to display
            if($scope.casesList.length===0){
                //#cases-table is the area on the page we are rendering
                //The list of cases, so we are setting it's HTML equal to the display message
                Helpers.showMessageArea('#cases-table',
                    'There are no cases to display. Please choose another folder.', true);
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
.controller('NewcaseController', function ($state, $scope, $http, $location, $localStorage, API){
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
                    $state.go('app.opencase');
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
.controller('NewprocessController', function ($rootScope, $scope, $state, $http, $location, $localStorage, API, Helpers){
        
        $scope.getProcessList = function(){
            //Set the requestType
            API.setRequestType('project');
            //Make the API call to get the list of available processes
            API.call(function(response){
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if(response.data.length===0){
                    //#new-process-area is the area on the page we are rendering
                    //The list of processes, so we are setting it's HTML equal to the display message
                    return Helpers.showMessageArea('#new-process-area',
                        'There are no processes to display.', true);
                }
                //Assign the data received from the API to the scope so that we
                //Can render the template with the data
                $scope.proList = response.data;
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
                //If the resulting data length is equal to 0, then we display a user friendly
                //Message stating that there is nothing to display
                if(response.data.length===0){
                    //#new-process-area is the area on the page we are rendering
                    //The list of processes, so we are setting it's HTML equal to the display message
                    return Helpers.showMessageArea('#new-process-area',
                        'There are no starting tasks for this process. Please choose another process.', true);
                }
                $localStorage.startingTasks = response.data;
                //Change the url so that the new case page is displayed
                $state.go('app.newcase');
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
            //#cases-table is the area on the page we are rendering
            //The list of cases, so we are setting it's HTML equal to the display message
            Helpers.showMessageArea('#cases-table',
                'There are no cases to display. Please choose another folder.', true);
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
.controller('RootController', function RootCtrl($rootScope, $scope, $location, $localStorage, $state, $http, API, Message, appTitle, genericHeaders, activeMenuItems, api_url, AccessToken){
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
        //This is EXTREMELY important - The whole UI is rendered based on if this is an access_token
        //So, we assign the scopes accessToken to the token
        //If the user is not logged in, the token object will be undefined
        //If the user IS logged in, the token object will hold the token information
        //E.g. access_token, refresh_token, expiry etc
        $localStorage.accessToken = token.access_token;
        //Display the default message
        Message.setMessageText('Welcome to the Angular JS ProcessMaker Front End! You are successfully logged in!');
        Message.setMessageType('success');
        return $state.go('app.home');
    });
    $rootScope.$on('oauth:loggedOut', function(event, token){
        //Destroy the session
        $scope.destroySession();
    });
    /*//When the user logs out, we do some things on this event
    $rootScope.$on('oauth:logout', function(){
        //Destroy the session
        $scope.destroySession();
    });*/

    $scope.destroySession = function(){
        //The user has logged out, so we destroy the access_token
        //Because of Angulars awesome live data binding, this automatically renders the view innate
        $localStorage.accessToken = null;
        //Destory the AccessToken object
        AccessToken.destroy();
        //Set the pages name to an unauthorized message
        $scope.currentPage = 'Home';
        //Set the pages description to an unauthorized message
        $scope.pageDesc = 'AngularJS meets ProcessMaker! This is your Home Page!';
        //Redirect the user back to the home page
        return $state.go('app.home');
    };
    /**
     * @author ethan@colosa.com
     * @name openCase
     * @desc Opens a dynaform and displays the data for the user
     * @param app_uid - required - the application unique identifier for the case you wish to open
     * @param delIndex - required - the delegation index of the current application that you are opening
     */
    $scope.openCase = function(app_uid, delIndex){
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
                //Call the open case state and transition to it
                $state.go('app.opencase');
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
                //#cases-table is the area on the page we are rendering
                //The list of cases, so we are setting it's HTML equal to the display message
                Helpers.showMessageArea('#cases-table',
                    'There are no cases to display. Please choose another folder.', true);
            }
        });
    });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsInJvdXRlcy5qcyIsInZhcmlhYmxlcy5qcyIsIm5nLW9hdXRoLmpzIiwiaGVscGVycy5qcyIsImFwaS5qcyIsIm5nc3RvcmFnZS5qcyIsIm1lc3NhZ2UuanMiLCJkcmFmdC5qcyIsImR5bmFmb3JtLmpzIiwiaG9tZS5qcyIsImluYm94LmpzIiwibmV3Y2FzZS5qcyIsIm5ld3Byb2Nlc3MuanMiLCJwYXJ0aWNpcGF0ZWQuanMiLCJyb290LmpzIiwidW5hc3NpZ25lZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBuZ2RvYyBvdmVydmlld1xuICogQG5hbWUgcG1Bbmd1bGFyQXBwXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgcG1Bbmd1bGFyIGlzIGEgbmF0aXZlIEFuZ3VsYXJKUyBmcm9udCBlbmQgaW5ib3ggdGhhdCBjb25uZWN0cyB0byBQcm9jZXNzTWFrZXIgMy4wIFJFU1QgQVBJIHdpdGggT0F1dGggMi4wXG4gKlxuICogTWFpbiBtb2R1bGUgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICovXG4vL0NyZWF0ZSB0aGUgYXBwXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJywgW1xuICAgICdvYXV0aCcsXG4gICAgJ3VpLmJvb3RzdHJhcCcsICAgICAgICAgIC8vQm9vdHN0cmFwIGZyYW1ld29yayBmb3IgQW5ndWxhckpTXG4gICAgJ3VpLnJvdXRlcidcbl0pOyIsImFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuICAgIC5jb25maWcoWyckbG9jYXRpb25Qcm92aWRlcicsICckaHR0cFByb3ZpZGVyJywgJyRicm93c2VyUHJvdmlkZXInLCAnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywgZnVuY3Rpb24oJGxvY2F0aW9uUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRicm93c2VyUHJvdmlkZXIsICRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpe1xuXG4gICAgICAgIC8vQ29uZmlndXJlIHRoZSB1cmwgcm91dGVzLCB0aGlzIGlzIGJhc2ljYWxseSB0aGUgbmF2aWdhdGlvbiBvZiB0aGUgYXBwXG4gICAgICAgIC8vRm9yIGVhY2ggcm91dGUgd2UgZGVmaW5lIGl0J3MgYXNzb2NpYXRlZDogdGVtcGxhdGUsIGNvbnRyb2xsZXIsIHRlbXBsYXRlIHZhcmlhYmxlczogcGFnZSBuYW1lIGFuZCBkZXNjcmlwdGlvblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXBwL2hvbWUnKTtcblxuICAgICAgICAkc3RhdGVQcm92aWRlclxuICAgICAgICAgICAgLnN0YXRlKCdhcHAnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL2FwcCcsXG4gICAgICAgICAgICAgICAgLy9hYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBBcHAgUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnQXBwJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnc2lkZWJhckAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3NpZGViYXIuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9hcHAuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5ob21lJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9ob21lJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBIb21lIFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2hvbWUuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5pbmJveCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvaW5ib3gnLFxuICAgICAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIEluYm94IFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ0luYm94JyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSW5ib3hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvaW5ib3guaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5kcmFmdCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvZHJhZnQnLFxuICAgICAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIERyYWZ0IFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ0RyYWZ0JyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnRHJhZnRDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvZHJhZnQuaHRtbCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ2FwcC5uZXdwcm9jZXNzJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9uZXdwcm9jZXNzJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBOZXcgUHJvY2VzcyBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdOZXcgUHJvY2VzcycsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ05ld3Byb2Nlc3NDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbmV3cHJvY2Vzcy5odG1sJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnYXBwLm5ld2Nhc2UnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL25ld2Nhc2UnLFxuICAgICAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIE5ldyBDYXNlIFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ05ldyBDYXNlJyxcbiAgICAgICAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnTmV3Y2FzZUNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9uZXdjYXNlLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXRlKCdhcHAub3BlbmNhc2UnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL29wZW5jYXNlJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBEeW5hZm9ybSBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdEeW5hZm9ybScsXG4gICAgICAgICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0R5bmFmb3JtQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2R5bmFmb3JtLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXRlKCdhcHAucGFydGljaXBhdGVkJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9wYXJ0aWNpcGF0ZWQnLFxuICAgICAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIFBhcnRpY2lwYXRlZCBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdQYXJ0aWNpcGF0ZWQnLFxuICAgICAgICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYXJ0aWNpcGF0ZWRDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvcGFydGljaXBhdGVkLmh0bWwnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIDtcblxuICAgICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnRXhwaXJlZEludGVyY2VwdG9yJyk7XG4gICAgfV0pOyIsIi8vVGhlIHVybCBmb3IgdGhlIFJFU1QgQVBJXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2FwaV91cmwnLCAnJCRBcGlVcmwkJCcpO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdjb25maWdfb2JqZWN0JywgJCRDb25maWdPYmplY3QkJCk7XG4vL0luamVjdCB0aGUgbmFtZSBvZiB0aGUgYXBwbGljYXRpb24gaW50byBvdXIgYXBwbGljYXRpb24gc28gdGhhdCB3ZSBjYW4gdXNlIGlpdFxuLy9XaGVuIHdlIHJlbmRlciB0aGUgcGFnZVxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdhcHBUaXRsZScsICckJEFwcFRpdGxlJCQnKTtcbi8vRGVmaW5lIHRoZSBnZW5lcmljIGhlYWRlciBmb3IgdGhlIGNhc2UgbGlzdCB2aWV3XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2dlbmVyaWNIZWFkZXJzJywgW1xuICAgIHt0aXRsZTogJ0Nhc2UgIyd9LFxuICAgIHt0aXRsZTogJ1Byb2Nlc3MnfSxcbiAgICB7dGl0bGU6ICdUYXNrJ30sXG4gICAge3RpdGxlOiAnU2VudCBCeSd9LFxuICAgIHt0aXRsZTogJ0R1ZSBEYXRlJ30sXG4gICAge3RpdGxlOiAnTGFzdCBNb2RpZmllZCd9LFxuICAgIHt0aXRsZTogJ1ByaW9yaXR5J31cbl0pO1xuLy9EZWZpbmUgdGhlIGFjdGl2ZSBtZW51IGl0ZW1zIGZvciB0aGUgYXBwbGljYXRpb25cbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnYWN0aXZlTWVudUl0ZW1zJyxcbiAgICB7XG4gICAgICAgICdOZXcgUHJvY2VzcycgOiAnbmV3cHJvY2Vzc1NlbGVjdGVkJyxcbiAgICAgICAgJ0luYm94JzogJ2luYm94U2VsZWN0ZWQnLFxuICAgICAgICAnRHJhZnQnIDogJ2RyYWZ0U2VsZWN0ZWQnLFxuICAgICAgICAnUGFydGljaXBhdGVkJyA6ICdwYXJ0aWNpcGF0ZWRTZWxlY3RlZCcsXG4gICAgICAgICdVbmFzc2lnbmVkJyA6ICd1bmFzc2lnbmVkU2VsZWN0ZWQnXG4gICAgfVxuKTsiLCIvKiBvYXV0aC1uZyAtIHYwLjQuMiAtIDIwMTUtMDYtMTkgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBBcHAgbGlicmFyaWVzXG5hbmd1bGFyLm1vZHVsZSgnb2F1dGgnLCBbXG4gICdvYXV0aC5kaXJlY3RpdmUnLCAgICAgIC8vIGxvZ2luIGRpcmVjdGl2ZVxuICAnb2F1dGguYWNjZXNzVG9rZW4nLCAgICAvLyBhY2Nlc3MgdG9rZW4gc2VydmljZVxuICAnb2F1dGguZW5kcG9pbnQnLCAgICAgICAvLyBvYXV0aCBlbmRwb2ludCBzZXJ2aWNlXG4gICdvYXV0aC5wcm9maWxlJywgICAgICAgIC8vIHByb2ZpbGUgbW9kZWxcbiAgJ29hdXRoLnN0b3JhZ2UnLCAgICAgICAgLy8gc3RvcmFnZVxuICAnb2F1dGguaW50ZXJjZXB0b3InICAgICAvLyBiZWFyZXIgdG9rZW4gaW50ZXJjZXB0b3Jcbl0pXG4gIC5jb25maWcoWyckbG9jYXRpb25Qcm92aWRlcicsJyRodHRwUHJvdmlkZXInLFxuICBmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKS5oYXNoUHJlZml4KCchJyk7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnRXhwaXJlZEludGVyY2VwdG9yJyk7XG4gIH1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYWNjZXNzVG9rZW5TZXJ2aWNlID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmFjY2Vzc1Rva2VuJywgW10pO1xuXG5hY2Nlc3NUb2tlblNlcnZpY2UuZmFjdG9yeSgnQWNjZXNzVG9rZW4nLCBbJ1N0b3JhZ2UnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnJGludGVydmFsJywgZnVuY3Rpb24oU3RvcmFnZSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCAkaW50ZXJ2YWwpe1xuXG4gIHZhciBzZXJ2aWNlID0ge1xuICAgIHRva2VuOiBudWxsXG4gIH0sXG4gIG9BdXRoMkhhc2hUb2tlbnMgPSBbIC8vcGVyIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY3NDkjc2VjdGlvbi00LjIuMlxuICAgICdhY2Nlc3NfdG9rZW4nLCAndG9rZW5fdHlwZScsICdleHBpcmVzX2luJywgJ3Njb3BlJywgJ3N0YXRlJyxcbiAgICAnZXJyb3InLCdlcnJvcl9kZXNjcmlwdGlvbidcbiAgXTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWNjZXNzIHRva2VuLlxuICAgKi9cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIGFuZCByZXR1cm5zIHRoZSBhY2Nlc3MgdG9rZW4uIEl0IHRyaWVzIChpbiBvcmRlcikgdGhlIGZvbGxvd2luZyBzdHJhdGVnaWVzOlxuICAgKiAtIHRha2VzIHRoZSB0b2tlbiBmcm9tIHRoZSBmcmFnbWVudCBVUklcbiAgICogLSB0YWtlcyB0aGUgdG9rZW4gZnJvbSB0aGUgc2Vzc2lvblN0b3JhZ2VcbiAgICovXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLnNldFRva2VuRnJvbVN0cmluZygkbG9jYXRpb24uaGFzaCgpKTtcblxuICAgIC8vSWYgaGFzaCBpcyBwcmVzZW50IGluIFVSTCBhbHdheXMgdXNlIGl0LCBjdXogaXRzIGNvbWluZyBmcm9tIG9BdXRoMiBwcm92aWRlciByZWRpcmVjdFxuICAgIGlmKG51bGwgPT09IHNlcnZpY2UudG9rZW4pe1xuICAgICAgc2V0VG9rZW5Gcm9tU2Vzc2lvbigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIGFjY2VzcyB0b2tlbiBhbmQgcmVtb3ZlIHRoZSBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyB7bnVsbH1cbiAgICovXG4gIHNlcnZpY2UuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgU3RvcmFnZS5kZWxldGUoJ3Rva2VuJyk7XG4gICAgdGhpcy50b2tlbiA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXMudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIFRlbGxzIGlmIHRoZSBhY2Nlc3MgdG9rZW4gaXMgZXhwaXJlZC5cbiAgICovXG4gIHNlcnZpY2UuZXhwaXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnRva2VuICYmIHRoaXMudG9rZW4uZXhwaXJlc19hdCAmJiBuZXcgRGF0ZSh0aGlzLnRva2VuLmV4cGlyZXNfYXQpIDwgbmV3IERhdGUoKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjZXNzIHRva2VuIGZyb20gYSBzdHJpbmcgYW5kIHNhdmUgaXRcbiAgICogQHBhcmFtIGhhc2hcbiAgICovXG4gIHNlcnZpY2Uuc2V0VG9rZW5Gcm9tU3RyaW5nID0gZnVuY3Rpb24oaGFzaCl7XG4gICAgdmFyIHBhcmFtcyA9IGdldFRva2VuRnJvbVN0cmluZyhoYXNoKTtcblxuICAgIGlmKHBhcmFtcyl7XG4gICAgICByZW1vdmVGcmFnbWVudCgpO1xuICAgICAgc2V0VG9rZW4ocGFyYW1zKTtcbiAgICAgIHNldEV4cGlyZXNBdCgpO1xuICAgICAgLy8gV2UgaGF2ZSB0byBzYXZlIGl0IGFnYWluIHRvIG1ha2Ugc3VyZSBleHBpcmVzX2F0IGlzIHNldFxuICAgICAgLy8gIGFuZCB0aGUgZXhwaXJ5IGV2ZW50IGlzIHNldCB1cCBwcm9wZXJseVxuICAgICAgc2V0VG9rZW4odGhpcy50b2tlbik7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmxvZ2luJywgc2VydmljZS50b2tlbik7XG4gICAgfVxuICB9O1xuXG4gIC8qICogKiAqICogKiAqICogKiAqXG4gICAqIFBSSVZBVEUgTUVUSE9EUyAqXG4gICAqICogKiAqICogKiAqICogKiAqL1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFjY2VzcyB0b2tlbiBmcm9tIHRoZSBzZXNzaW9uU3RvcmFnZS5cbiAgICovXG4gIHZhciBzZXRUb2tlbkZyb21TZXNzaW9uID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGFyYW1zID0gU3RvcmFnZS5nZXQoJ3Rva2VuJyk7XG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgc2V0VG9rZW4ocGFyYW1zKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYWNjZXNzIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zXG4gICAqIEByZXR1cm5zIHsqfHt9fVxuICAgKi9cbiAgdmFyIHNldFRva2VuID0gZnVuY3Rpb24ocGFyYW1zKXtcbiAgICBzZXJ2aWNlLnRva2VuID0gc2VydmljZS50b2tlbiB8fCB7fTsgICAgICAvLyBpbml0IHRoZSB0b2tlblxuICAgIGFuZ3VsYXIuZXh0ZW5kKHNlcnZpY2UudG9rZW4sIHBhcmFtcyk7ICAgICAgLy8gc2V0IHRoZSBhY2Nlc3MgdG9rZW4gcGFyYW1zXG4gICAgc2V0VG9rZW5JblNlc3Npb24oKTsgICAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW4gaW50byB0aGUgc2Vzc2lvblxuICAgIHNldEV4cGlyZXNBdEV2ZW50KCk7ICAgICAgICAgICAgICAgIC8vIGV2ZW50IHRvIGZpcmUgd2hlbiB0aGUgdG9rZW4gZXhwaXJlc1xuXG4gICAgcmV0dXJuIHNlcnZpY2UudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBmcmFnbWVudCBVUkkgYW5kIHJldHVybiBhbiBvYmplY3RcbiAgICogQHBhcmFtIGhhc2hcbiAgICogQHJldHVybnMge3t9fVxuICAgKi9cbiAgdmFyIGdldFRva2VuRnJvbVN0cmluZyA9IGZ1bmN0aW9uKGhhc2gpe1xuICAgIHZhciBwYXJhbXMgPSB7fSxcbiAgICAgICAgcmVnZXggPSAvKFteJj1dKyk9KFteJl0qKS9nLFxuICAgICAgICBtO1xuXG4gICAgd2hpbGUgKChtID0gcmVnZXguZXhlYyhoYXNoKSkgIT09IG51bGwpIHtcbiAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQobVsxXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KG1bMl0pO1xuICAgIH1cblxuICAgIGlmKHBhcmFtcy5hY2Nlc3NfdG9rZW4gfHwgcGFyYW1zLmVycm9yKXtcbiAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTYXZlIHRoZSBhY2Nlc3MgdG9rZW4gaW50byB0aGUgc2Vzc2lvblxuICAgKi9cbiAgdmFyIHNldFRva2VuSW5TZXNzaW9uID0gZnVuY3Rpb24oKXtcbiAgICBTdG9yYWdlLnNldCgndG9rZW4nLCBzZXJ2aWNlLnRva2VuKTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSBhY2Nlc3MgdG9rZW4gZXhwaXJhdGlvbiBkYXRlICh1c2VmdWwgZm9yIHJlZnJlc2ggbG9naWNzKVxuICAgKi9cbiAgdmFyIHNldEV4cGlyZXNBdCA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKCFzZXJ2aWNlLnRva2VuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHR5cGVvZihzZXJ2aWNlLnRva2VuLmV4cGlyZXNfaW4pICE9PSAndW5kZWZpbmVkJyAmJiBzZXJ2aWNlLnRva2VuLmV4cGlyZXNfaW4gIT09IG51bGwpIHtcbiAgICAgIHZhciBleHBpcmVzX2F0ID0gbmV3IERhdGUoKTtcbiAgICAgIGV4cGlyZXNfYXQuc2V0U2Vjb25kcyhleHBpcmVzX2F0LmdldFNlY29uZHMoKSArIHBhcnNlSW50KHNlcnZpY2UudG9rZW4uZXhwaXJlc19pbiktNjApOyAvLyA2MCBzZWNvbmRzIGxlc3MgdG8gc2VjdXJlIGJyb3dzZXIgYW5kIHJlc3BvbnNlIGxhdGVuY3lcbiAgICAgIHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCA9IGV4cGlyZXNfYXQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgc2VydmljZS50b2tlbi5leHBpcmVzX2F0ID0gbnVsbDtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogU2V0IHRoZSB0aW1lb3V0IGF0IHdoaWNoIHRoZSBleHBpcmVkIGV2ZW50IGlzIGZpcmVkXG4gICAqL1xuICB2YXIgc2V0RXhwaXJlc0F0RXZlbnQgPSBmdW5jdGlvbigpe1xuICAgIC8vIERvbid0IGJvdGhlciBpZiB0aGVyZSdzIG5vIGV4cGlyZXMgdG9rZW5cbiAgICBpZiAodHlwZW9mKHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCkgPT09ICd1bmRlZmluZWQnIHx8IHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZSA9IChuZXcgRGF0ZShzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQpKS0obmV3IERhdGUoKSk7XG4gICAgaWYodGltZSl7XG4gICAgICAkaW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpleHBpcmVkJywgc2VydmljZS50b2tlbik7XG4gICAgICB9LCB0aW1lLCAxKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgb0F1dGgyIHBpZWNlcyBmcm9tIHRoZSBoYXNoIGZyYWdtZW50XG4gICAqL1xuICB2YXIgcmVtb3ZlRnJhZ21lbnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjdXJIYXNoID0gJGxvY2F0aW9uLmhhc2goKTtcbiAgICBhbmd1bGFyLmZvckVhY2gob0F1dGgySGFzaFRva2VucyxmdW5jdGlvbihoYXNoS2V5KXtcbiAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoJyYnK2hhc2hLZXkrJyg9W14mXSopP3xeJytoYXNoS2V5KycoPVteJl0qKT8mPycpO1xuICAgICAgY3VySGFzaCA9IGN1ckhhc2gucmVwbGFjZShyZSwnJyk7XG4gICAgfSk7XG5cbiAgICAkbG9jYXRpb24uaGFzaChjdXJIYXNoKTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcblxufV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbmRwb2ludENsaWVudCA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5lbmRwb2ludCcsIFtdKTtcblxuZW5kcG9pbnRDbGllbnQuZmFjdG9yeSgnRW5kcG9pbnQnLCBmdW5jdGlvbigpIHtcblxuICB2YXIgc2VydmljZSA9IHt9O1xuXG4gIC8qXG4gICAqIERlZmluZXMgdGhlIGF1dGhvcml6YXRpb24gVVJMXG4gICAqL1xuXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbikge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlndXJhdGlvbjtcbiAgICByZXR1cm4gdGhpcy5nZXQoKTtcbiAgfTtcblxuICAvKlxuICAgKiBSZXR1cm5zIHRoZSBhdXRob3JpemF0aW9uIFVSTFxuICAgKi9cblxuICBzZXJ2aWNlLmdldCA9IGZ1bmN0aW9uKCBvdmVycmlkZXMgKSB7XG4gICAgdmFyIHBhcmFtcyA9IGFuZ3VsYXIuZXh0ZW5kKCB7fSwgc2VydmljZS5jb25maWcsIG92ZXJyaWRlcyk7XG4gICAgdmFyIG9BdXRoU2NvcGUgPSAocGFyYW1zLnNjb3BlKSA/IGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMuc2NvcGUpIDogJycsXG4gICAgICAgIHN0YXRlID0gKHBhcmFtcy5zdGF0ZSkgPyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnN0YXRlKSA6ICcnLFxuICAgICAgICBhdXRoUGF0aEhhc1F1ZXJ5ID0gKHBhcmFtcy5hdXRob3JpemVQYXRoLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICBhcHBlbmRDaGFyID0gKGF1dGhQYXRoSGFzUXVlcnkpID8gJyYnIDogJz8nLCAgICAvL2lmIGF1dGhvcml6ZVBhdGggaGFzID8gYWxyZWFkeSBhcHBlbmQgT0F1dGgyIHBhcmFtc1xuICAgICAgICByZXNwb25zZVR5cGUgPSAocGFyYW1zLnJlc3BvbnNlVHlwZSkgPyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnJlc3BvbnNlVHlwZSkgOiAnJztcblxuICAgIHZhciB1cmwgPSBwYXJhbXMuc2l0ZSArXG4gICAgICAgICAgcGFyYW1zLmF1dGhvcml6ZVBhdGggK1xuICAgICAgICAgIGFwcGVuZENoYXIgKyAncmVzcG9uc2VfdHlwZT0nICsgcmVzcG9uc2VUeXBlICsgJyYnICtcbiAgICAgICAgICAnY2xpZW50X2lkPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLmNsaWVudElkKSArICcmJyArXG4gICAgICAgICAgJ3JlZGlyZWN0X3VyaT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5yZWRpcmVjdFVyaSkgKyAnJicgK1xuICAgICAgICAgICdzY29wZT0nICsgb0F1dGhTY29wZSArICcmJyArXG4gICAgICAgICAgJ3N0YXRlPScgKyBzdGF0ZTtcblxuICAgIGlmKCBwYXJhbXMubm9uY2UgKSB7XG4gICAgICB1cmwgPSB1cmwgKyAnJm5vbmNlPScgKyBwYXJhbXMubm9uY2U7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH07XG5cbiAgLypcbiAgICogUmVkaXJlY3RzIHRoZSBhcHAgdG8gdGhlIGF1dGhvcml6YXRpb24gVVJMXG4gICAqL1xuXG4gIHNlcnZpY2UucmVkaXJlY3QgPSBmdW5jdGlvbiggb3ZlcnJpZGVzICkge1xuICAgIHZhciB0YXJnZXRMb2NhdGlvbiA9IHRoaXMuZ2V0KCBvdmVycmlkZXMgKTtcbiAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh0YXJnZXRMb2NhdGlvbik7XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG59KTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHJvZmlsZUNsaWVudCA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5wcm9maWxlJywgW10pO1xuXG5wcm9maWxlQ2xpZW50LmZhY3RvcnkoJ1Byb2ZpbGUnLCBbJyRodHRwJywgJ0FjY2Vzc1Rva2VuJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgQWNjZXNzVG9rZW4sICRyb290U2NvcGUpIHtcbiAgdmFyIHNlcnZpY2UgPSB7fTtcbiAgdmFyIHByb2ZpbGU7XG5cbiAgc2VydmljZS5maW5kID0gZnVuY3Rpb24odXJpKSB7XG4gICAgdmFyIHByb21pc2UgPSAkaHR0cC5nZXQodXJpLCB7IGhlYWRlcnM6IGhlYWRlcnMoKSB9KTtcbiAgICBwcm9taXNlLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcHJvZmlsZSA9IHJlc3BvbnNlO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOnByb2ZpbGUnLCBwcm9maWxlKTtcbiAgICAgIH0pO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9O1xuXG4gIHNlcnZpY2UuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHByb2ZpbGU7XG4gIH07XG5cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbihyZXNvdXJjZSkge1xuICAgIHByb2ZpbGUgPSByZXNvdXJjZTtcbiAgICByZXR1cm4gcHJvZmlsZTtcbiAgfTtcblxuICB2YXIgaGVhZGVycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7IEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIEFjY2Vzc1Rva2VuLmdldCgpLmFjY2Vzc190b2tlbiB9O1xuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdG9yYWdlU2VydmljZSA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5zdG9yYWdlJywgWyduZ1N0b3JhZ2UnXSk7XG5cbnN0b3JhZ2VTZXJ2aWNlLmZhY3RvcnkoJ1N0b3JhZ2UnLCBbJyRyb290U2NvcGUnLCAnJHNlc3Npb25TdG9yYWdlJywgJyRsb2NhbFN0b3JhZ2UnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2Vzc2lvblN0b3JhZ2UsICRsb2NhbFN0b3JhZ2Upe1xuXG4gIHZhciBzZXJ2aWNlID0ge1xuICAgIHN0b3JhZ2U6ICRzZXNzaW9uU3RvcmFnZSAvLyBCeSBkZWZhdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgdGhlIGl0ZW0gZnJvbSBzdG9yYWdlLFxuICAgKiBSZXR1cm5zIHRoZSBpdGVtJ3MgcHJldmlvdXMgdmFsdWVcbiAgICovXG4gIHNlcnZpY2UuZGVsZXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgc3RvcmVkID0gdGhpcy5nZXQobmFtZSk7XG4gICAgZGVsZXRlIHRoaXMuc3RvcmFnZVtuYW1lXTtcbiAgICByZXR1cm4gc3RvcmVkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpdGVtIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLnN0b3JhZ2VbbmFtZV07XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGl0ZW0gaW4gc3RvcmFnZSB0byB0aGUgdmFsdWUgc3BlY2lmaWVkXG4gICAqIFJldHVybnMgdGhlIGl0ZW0ncyB2YWx1ZVxuICAgKi9cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLnN0b3JhZ2VbbmFtZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5nZXQobmFtZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgc3RvcmFnZSBzZXJ2aWNlIGJlaW5nIHVzZWRcbiAgICovXG4gIHNlcnZpY2UudXNlID0gZnVuY3Rpb24gKHN0b3JhZ2UpIHtcbiAgICBpZiAoc3RvcmFnZSA9PT0gJ3Nlc3Npb25TdG9yYWdlJykge1xuICAgICAgdGhpcy5zdG9yYWdlID0gJHNlc3Npb25TdG9yYWdlO1xuICAgIH0gZWxzZSBpZiAoc3RvcmFnZSA9PT0gJ2xvY2FsU3RvcmFnZScpIHtcbiAgICAgIHRoaXMuc3RvcmFnZSA9ICRsb2NhbFN0b3JhZ2U7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufV0pO1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW50ZXJjZXB0b3JTZXJ2aWNlID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmludGVyY2VwdG9yJywgW10pO1xuXG5pbnRlcmNlcHRvclNlcnZpY2UuZmFjdG9yeSgnRXhwaXJlZEludGVyY2VwdG9yJywgWydTdG9yYWdlJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoU3RvcmFnZSwgJHJvb3RTY29wZSkge1xuXG4gIHZhciBzZXJ2aWNlID0ge307XG5cbiAgc2VydmljZS5yZXF1ZXN0ID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIHRva2VuID0gU3RvcmFnZS5nZXQoJ3Rva2VuJyk7XG5cbiAgICBpZiAodG9rZW4gJiYgZXhwaXJlZCh0b2tlbikpIHtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6ZXhwaXJlZCcsIHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnO1xuICB9O1xuXG4gIHZhciBleHBpcmVkID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gKHRva2VuICYmIHRva2VuLmV4cGlyZXNfYXQgJiYgbmV3IERhdGUodG9rZW4uZXhwaXJlc19hdCkgPCBuZXcgRGF0ZSgpKTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcbn1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGlyZWN0aXZlcyA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5kaXJlY3RpdmUnLCBbXSk7XG5cbmRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdvYXV0aCcsIFtcbiAgJ0FjY2Vzc1Rva2VuJyxcbiAgJ0VuZHBvaW50JyxcbiAgJ1Byb2ZpbGUnLFxuICAnU3RvcmFnZScsXG4gICckbG9jYXRpb24nLFxuICAnJHJvb3RTY29wZScsXG4gICckY29tcGlsZScsXG4gICckaHR0cCcsXG4gICckdGVtcGxhdGVDYWNoZScsXG4gICdjb25maWdfb2JqZWN0JyxcbiAgZnVuY3Rpb24oQWNjZXNzVG9rZW4sIEVuZHBvaW50LCBQcm9maWxlLCBTdG9yYWdlLCAkbG9jYXRpb24sICRyb290U2NvcGUsICRjb21waWxlLCAkaHR0cCwgJHRlbXBsYXRlQ2FjaGUsIGNvbmZpZ19vYmplY3QpIHtcblxuICAgIHZhciBkZWZpbml0aW9uID0ge1xuICAgICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgc2l0ZTogJ0AnLCAgICAgICAgICAvLyAocmVxdWlyZWQpIHNldCB0aGUgb2F1dGggc2VydmVyIGhvc3QgKGUuZy4gaHR0cDovL29hdXRoLmV4YW1wbGUuY29tKVxuICAgICAgICBjbGllbnRJZDogJ0AnLCAgICAgIC8vIChyZXF1aXJlZCkgY2xpZW50IGlkXG4gICAgICAgIHJlZGlyZWN0VXJpOiAnQCcsICAgLy8gKHJlcXVpcmVkKSBjbGllbnQgcmVkaXJlY3QgdXJpXG4gICAgICAgIHJlc3BvbnNlVHlwZTogJ0AnLCAgLy8gKG9wdGlvbmFsKSByZXNwb25zZSB0eXBlLCBkZWZhdWx0cyB0byB0b2tlbiAodXNlICd0b2tlbicgZm9yIGltcGxpY2l0IGZsb3cgYW5kICdjb2RlJyBmb3IgYXV0aG9yaXphdGlvbiBjb2RlIGZsb3dcbiAgICAgICAgc2NvcGU6ICdAJywgICAgICAgICAvLyAob3B0aW9uYWwpIHNjb3BlXG4gICAgICAgIHByb2ZpbGVVcmk6ICdAJywgICAgLy8gKG9wdGlvbmFsKSB1c2VyIHByb2ZpbGUgdXJpIChlLmcgaHR0cDovL2V4YW1wbGUuY29tL21lKVxuICAgICAgICB0ZW1wbGF0ZTogJ0AnLCAgICAgIC8vIChvcHRpb25hbCkgdGVtcGxhdGUgdG8gcmVuZGVyIChlLmcgYm93ZXJfY29tcG9uZW50cy9vYXV0aC1uZy9kaXN0L3ZpZXdzL3RlbXBsYXRlcy9kZWZhdWx0Lmh0bWwpXG4gICAgICAgIHRleHQ6ICdAJywgICAgICAgICAgLy8gKG9wdGlvbmFsKSBsb2dpbiB0ZXh0XG4gICAgICAgIGF1dGhvcml6ZVBhdGg6ICdAJywgLy8gKG9wdGlvbmFsKSBhdXRob3JpemF0aW9uIHVybFxuICAgICAgICBzdGF0ZTogJ0AnLCAgICAgICAgIC8vIChvcHRpb25hbCkgQW4gYXJiaXRyYXJ5IHVuaXF1ZSBzdHJpbmcgY3JlYXRlZCBieSB5b3VyIGFwcCB0byBndWFyZCBhZ2FpbnN0IENyb3NzLXNpdGUgUmVxdWVzdCBGb3JnZXJ5XG4gICAgICAgIHN0b3JhZ2U6ICdAJyAgICAgICAgLy8gKG9wdGlvbmFsKSBTdG9yZSB0b2tlbiBpbiAnc2Vzc2lvblN0b3JhZ2UnIG9yICdsb2NhbFN0b3JhZ2UnLCBkZWZhdWx0cyB0byAnc2Vzc2lvblN0b3JhZ2UnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGRlZmluaXRpb24ubGluayA9IGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICBzY29wZS5zaG93ID0gJ25vbmUnO1xuXG4gICAgICBzY29wZS4kd2F0Y2goJ2NsaWVudElkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGluaXQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpbml0QXR0cmlidXRlcygpOyAgICAgICAgICAvLyBzZXRzIGRlZmF1bHRzXG4gICAgICAgIFN0b3JhZ2UudXNlKHNjb3BlLnN0b3JhZ2UpOy8vIHNldCBzdG9yYWdlXG4gICAgICAgIGNvbXBpbGUoKTsgICAgICAgICAgICAgICAgIC8vIGNvbXBpbGVzIHRoZSBkZXNpcmVkIGxheW91dFxuICAgICAgICBFbmRwb2ludC5zZXQoc2NvcGUpOyAgICAgICAvLyBzZXRzIHRoZSBvYXV0aCBhdXRob3JpemF0aW9uIHVybFxuICAgICAgICBBY2Nlc3NUb2tlbi5zZXQoc2NvcGUpOyAgICAvLyBzZXRzIHRoZSBhY2Nlc3MgdG9rZW4gb2JqZWN0IChpZiBleGlzdGluZywgZnJvbSBmcmFnbWVudCBvciBzZXNzaW9uKVxuICAgICAgICBpbml0UHJvZmlsZShzY29wZSk7ICAgICAgICAvLyBnZXRzIHRoZSBwcm9maWxlIHJlc291cmNlIChpZiBleGlzdGluZyB0aGUgYWNjZXNzIHRva2VuKVxuICAgICAgICBpbml0VmlldygpOyAgICAgICAgICAgICAgICAvLyBzZXRzIHRoZSB2aWV3IChsb2dnZWQgaW4gb3Igb3V0KVxuICAgICAgfTtcblxuICAgICAgdmFyIGluaXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNjb3BlLmF1dGhvcml6ZVBhdGggPSBzY29wZS5hdXRob3JpemVQYXRoIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLmF1dGhvcml6ZVBhdGg7XG4gICAgICAgIHNjb3BlLnRva2VuUGF0aCAgICAgPSBzY29wZS50b2tlblBhdGggICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnRva2VuUGF0aDtcbiAgICAgICAgc2NvcGUudGVtcGxhdGUgICAgICA9IHNjb3BlLnRlbXBsYXRlICAgICAgfHwgJ3ZpZXdzL3RlbXBsYXRlcy9idXR0b24uaHRtbCc7XG4gICAgICAgIHNjb3BlLnJlc3BvbnNlVHlwZSAgPSBzY29wZS5yZXNwb25zZVR5cGUgIHx8ICd0b2tlbic7XG4gICAgICAgIHNjb3BlLnRleHQgICAgICAgICAgPSBzY29wZS50ZXh0ICAgICAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnRleHQ7XG4gICAgICAgIHNjb3BlLnN0YXRlICAgICAgICAgPSBzY29wZS5zdGF0ZSAgICAgICAgIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgc2NvcGUuc2NvcGUgICAgICAgICA9IHNjb3BlLnNjb3BlICAgICAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24uc2NvcGU7XG4gICAgICAgIHNjb3BlLnN0b3JhZ2UgICAgICAgPSBzY29wZS5zdG9yYWdlICAgICAgIHx8ICdzZXNzaW9uU3RvcmFnZSc7XG4gICAgICAgIHNjb3BlLnNpdGUgICAgICAgICAgPSBzY29wZS5zaXRlICAgICAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnNpdGU7XG4gICAgICAgIHNjb3BlLmNsaWVudElkICAgICAgPSBzY29wZS5jbGllbnRJZCAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLmNsaWVudElkO1xuICAgICAgICBzY29wZS5yZWRpcmVjdFVyaSAgID0gc2NvcGUucmVkaXJlY3RVcmkgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5yZWRpcmVjdFVyaTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjb21waWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRodHRwLmdldChzY29wZS50ZW1wbGF0ZSwgeyBjYWNoZTogJHRlbXBsYXRlQ2FjaGUgfSkuc3VjY2VzcyhmdW5jdGlvbihodG1sKSB7XG4gICAgICAgICAgZWxlbWVudC5odG1sKGh0bWwpO1xuICAgICAgICAgICRjb21waWxlKGVsZW1lbnQuY29udGVudHMoKSkoc2NvcGUpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBpbml0UHJvZmlsZSA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IEFjY2Vzc1Rva2VuLmdldCgpO1xuXG4gICAgICAgIGlmICh0b2tlbiAmJiB0b2tlbi5hY2Nlc3NfdG9rZW4gJiYgc2NvcGUucHJvZmlsZVVyaSkge1xuICAgICAgICAgIFByb2ZpbGUuZmluZChzY29wZS5wcm9maWxlVXJpKS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzY29wZS5wcm9maWxlID0gcmVzcG9uc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBpbml0VmlldyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBBY2Nlc3NUb2tlbi5nZXQoKTtcblxuICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgcmV0dXJuIGxvZ2dlZE91dCgpOyAvLyB3aXRob3V0IGFjY2VzcyB0b2tlbiBpdCdzIGxvZ2dlZCBvdXRcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4uYWNjZXNzX3Rva2VuKSB7XG4gICAgICAgICAgcmV0dXJuIGF1dGhvcml6ZWQoKTsgLy8gaWYgdGhlcmUgaXMgdGhlIGFjY2VzcyB0b2tlbiB3ZSBhcmUgZG9uZVxuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbi5lcnJvcikge1xuICAgICAgICAgIHJldHVybiBkZW5pZWQoKTsgLy8gaWYgdGhlIHJlcXVlc3QgaGFzIGJlZW4gZGVuaWVkIHdlIGZpcmUgdGhlIGRlbmllZCBldmVudFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBFbmRwb2ludC5yZWRpcmVjdCgpO1xuICAgICAgfTtcblxuICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koc2NvcGUpO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmxvZ291dCcpO1xuICAgICAgICBsb2dnZWRPdXQoKTtcbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLiRvbignb2F1dGg6ZXhwaXJlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBBY2Nlc3NUb2tlbi5kZXN0cm95KHNjb3BlKTtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdsb2dnZWQtb3V0JztcbiAgICAgIH0pO1xuXG4gICAgICAvLyB1c2VyIGlzIGF1dGhvcml6ZWRcbiAgICAgIHZhciBhdXRob3JpemVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6YXV0aG9yaXplZCcsIEFjY2Vzc1Rva2VuLmdldCgpKTtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdsb2dnZWQtaW4nO1xuICAgICAgfTtcblxuICAgICAgLy8gc2V0IHRoZSBvYXV0aCBkaXJlY3RpdmUgdG8gdGhlIGxvZ2dlZC1vdXQgc3RhdHVzXG4gICAgICB2YXIgbG9nZ2VkT3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6bG9nZ2VkT3V0Jyk7XG4gICAgICAgIHNjb3BlLnNob3cgPSAnbG9nZ2VkLW91dCc7XG4gICAgICB9O1xuXG4gICAgICAvLyBzZXQgdGhlIG9hdXRoIGRpcmVjdGl2ZSB0byB0aGUgZGVuaWVkIHN0YXR1c1xuICAgICAgdmFyIGRlbmllZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzY29wZS5zaG93ID0gJ2RlbmllZCc7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6ZGVuaWVkJyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBVcGRhdGVzIHRoZSB0ZW1wbGF0ZSBhdCBydW50aW1lXG4gICAgICBzY29wZS4kb24oJ29hdXRoOnRlbXBsYXRlOnVwZGF0ZScsIGZ1bmN0aW9uKGV2ZW50LCB0ZW1wbGF0ZSkge1xuICAgICAgICBzY29wZS50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICBjb21waWxlKHNjb3BlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBIYWNrIHRvIHVwZGF0ZSB0aGUgZGlyZWN0aXZlIGNvbnRlbnQgb24gbG9nb3V0XG4gICAgICAvLyBUT0RPIHRoaW5rIHRvIGEgY2xlYW5lciBzb2x1dGlvblxuICAgICAgc2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpbml0KCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmluaXRpb247XG4gIH1cbl0pO1xuIiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMzEvMTRcbiAqIEBuYW1lIEFQSVxuICogQGRlc2MgQVBJIFNlcnZpY2UgZm9yIGNvbm5lY3RpbmcgdG8gdGhlIFByb2Nlc3NNYWtlciAzLjAgUkVTVCBBUElcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLy9TZXJ2aWNlIHRvIHByb3ZpZGUgaGVscGVyIGZ1bmN0aW9ucyB0byBiZSByZXVzZWQgYWNyb3NzIG11bHRpcGxlIGNsYXNzZXMvZmlsZXNcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS5cbnNlcnZpY2UoJ0hlbHBlcnMnLCBmdW5jdGlvbigpe1xuICAgIHJldHVybiB7XG4gICAgICAgIHNob3dNZXNzYWdlQXJlYTogZnVuY3Rpb24oaWQsIG1zZywgZGVidWcpe1xuICAgICAgICAgICAgZGVidWcgPSAoYW5ndWxhci5pc1VuZGVmaW5lZChkZWJ1ZykpPyBmYWxzZSA6IGRlYnVnO1xuICAgICAgICAgICAgaWYoZGVidWcpIGNvbnNvbGUubG9nKFwiSUQ6IFwiK2lkK1wiXFxuXFxyXCIrXCJNZXNzYWdlOiBcIittc2cpO1xuICAgICAgICAgICAgJChpZCkuaHRtbChcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj4nK1xuICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgJzxwPjxpIGNsYXNzPVwiaWNvbi1vayBibHVlXCI+PC9pPiAnK1xuICAgICAgICAgICAgICAgIG1zZytcbiAgICAgICAgICAgICAgICAgICAgJzwvcD48L2Rpdj4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzMxLzE0XG4gKiBAbmFtZSBBUElcbiAqIEBkZXNjIEFQSSBTZXJ2aWNlIGZvciBjb25uZWN0aW5nIHRvIHRoZSBQcm9jZXNzTWFrZXIgMy4wIFJFU1QgQVBJXG4gKi9cbid1c2Ugc3RyaWN0Jztcbi8vU2VydmljZSB0byBtYWtlIEFQSSBjYWxscyB0byB0aGUgUkVTVCBBUElcbi8vV2UgYXJlIHBhc3NpbmcgJGh0dHAgdG8gbWFrZSBhamF4IHJlcXVlc3RzIGFuZCB0aGUgdXJsIGZvciB0aGUgUkVTVCBBUElcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS5cbnNlcnZpY2UoJ0FQSScsIGZ1bmN0aW9uKCRodHRwLCBhcGlfdXJsKXtcbiAgICAvL1dlIGFyZSBkZWZpbmluZyB0aGUgcmVxdWVzdFR5cGUsIHRoaXMgaXMgdGhlIHNwZWNpZmljIGVuZHBvaW50IG9mIHRoZSBSRVNUIEFQSSB3ZSBhcmUgcmVxdWVzdGluZ1xuICAgIC8vUGFyYW1zIGFyZSBhbnkgcGFyYW1ldGVycyB0aGF0IHdlIGFyZSBwYXNzaW5nIGFzIHBhcnQgb2YgYSBwb3N0L3B1dCByZXF1ZXN0XG4gICAgdmFyIHJlcXVlc3RUeXBlLCBwYXJhbXM7XG4gICAgLy9EZWZpbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHNlcnZpY2VcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIGdldFJlcXVlc3RUeXBlXG4gICAgICAgICAqIEBkZXNjIEdldCBtZXRob2QgZm9yIGdldHRpbmcgdGhlIGN1cnJlbnQgcmVxdWVzdCB0eXBlXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0UmVxdWVzdFR5cGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0VHlwZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzZXRSZXF1ZXN0VHlwZVxuICAgICAgICAgKiBAZGVzYyBTZXQgbWV0aG9kIGZvciBzZXR0aW5nIHRoZSBjdXJyZW50IHJlcXVlc3QgdHlwZVxuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICovXG4gICAgICAgIHNldFJlcXVlc3RUeXBlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgcmVxdWVzdFR5cGUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBnZXRQYXJhbXNcbiAgICAgICAgICogQGRlc2MgR2V0IG1ldGhvZCBmb3IgZ2V0dGluZyB0aGUgY3VycmVudCBwYXJhbXNcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRQYXJhbXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgc2V0UGFyYW1zXG4gICAgICAgICAqIEBkZXNjIFNldCBtZXRob2QgZm9yIHNldHRpbmcgdGhlIGN1cnJlbnQgcGFyYW1zXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0UGFyYW1zOiBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgICBwYXJhbXMgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBuYW1lIHNldFBhcmFtc1xuICAgICAgICAgKiBAZGVzYyBUaGlzIGlzIHRoZSBtYWluIGZ1bmN0aW9uIG9mIHRoZSBzZXJ2aWNlLiBJdCBtYWtlcyBhIGNhbGwgdG8gdGhlIFJFU1QgQVBJXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFjayAtIHJlcXVpcmVkXG4gICAgICAgICAqIEBwYXJhbSByZXF1ZXN0VHlwZSAtIG9wdGlvbmFsXG4gICAgICAgICAqIEBwYXJhbSBtZXRob2QgLSBvcHRpb25hbFxuICAgICAgICAgKi9cbiAgICAgICAgY2FsbDogZnVuY3Rpb24oY2FsbGJhY2ssIG1ldGhvZCwgcmVxdWVzdFR5cGUsIGVyckhhbmRsZXIpe1xuXG4gICAgICAgICAgICAvL0RlZmluZSBvcHRpb25hbCBwYXJhbXMgc28gdGhhdCBvbmx5IGNhbGxiYWNrIG5lZWRzIHRvIGJlIHNwZWNpZmllZCB3aGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gICAgICAgICAgICAvL0Fzc2lnbiBkZWZhdWx0IHZhbHVlIG9nIEdFVCB0byB0aGUgbWV0aG9kIHRoYXQgd2UgYXJlIHJlcXVlc3RpbmdcblxuICAgICAgICAgICAgbWV0aG9kID0gKGFuZ3VsYXIuaXNVbmRlZmluZWQobWV0aG9kKSk/ICdHRVQnIDogbWV0aG9kO1xuXG4gICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZGVmYXVsdCB2YWx1ZSBvZiB0aGUgcmVxdWVzdCB0eXBlIHRvIHRoZSBnZXR0ZXIgbWV0aG9kLlxuICAgICAgICAgICAgLy9UaGlzIGlzIHRoZSB3YXkgdG8gdXNlIHRoZSBzZXJ2aWNlLiBTZXQgdGhlIHNldFJlcXVlc3RUeXBlIHRvIHRoZSB1cmwgZW5kcG9pbnQgeW91IHdhbnQgdG8gaGl0XG4gICAgICAgICAgICAvL0ZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCBhIGxpc3Qgb2YgcHJvamVjdHMvcHJvY2VzcywgaW4geW91ciBjb250cm9sbGVyIGRvIHRoaXMgYmVmb3JlIHlvdSBjYWxsIHRoaXMgbWV0aG9kOlxuICAgICAgICAgICAgLy9BUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3RzJyk7XG5cbiAgICAgICAgICAgIGlmKCBhbmd1bGFyLmlzVW5kZWZpbmVkKHJlcXVlc3RUeXBlKSl7XG4gICAgICAgICAgICAgICAgcmVxdWVzdFR5cGUgPSB0aGlzLmdldFJlcXVlc3RUeXBlKCk7XG4gICAgICAgICAgICAgICAgLy9IYW5kbGUgaWYgdGhlcmUgd2FzIG5vIHJlcXVlc3QgdHlwZSBkZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYoYW5ndWxhci5pc1VuZGVmaW5lZChyZXF1ZXN0VHlwZSkpIHJldHVybiAnTm8gcmVxdWVzdCB0eXBlIGRlZmluZWQuJztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlcnJIYW5kbGVyID0gKGFuZ3VsYXIuaXNVbmRlZmluZWQoZXJySGFuZGxlcikpP2Z1bmN0aW9uKCl7fSA6IGVyckhhbmRsZXI7XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgU3dpdGNoIGJhc2VkIG9uIG1ldGhvZCB0eXBlIGluIG9yZGVyIHRvIHJlcXVlc3QgdGhlIHJpZ2h0IHR5cGUgb2YgYXBpXG4gICAgICAgICAgICAgRGVmYXVsdCBpcyB0aGUgR0VUIG1ldGhvZCwgYmVjYXVzZSB0aGlzIGlzIHRoZSBtb3N0IGNvbW1vbiBtZXRob2QgdXNlZFxuICAgICAgICAgICAgIENvbnZlcnQgdGhlIG1ldGhvZCB0byB1cHBlciBjYXNlIGZvciBjb25zaXN0ZW5jeVxuXG4gICAgICAgICAgICAgRmlyc3QsIHdlIG1ha2UgdGhlIGFwcHJvcHJpYXRlIGFqYXggY2FsbCB3aXRoIHRoZSByZWxldmFudCBlbmQgcG9pbnQgYXR0YWNoZWQgdG8gaXRcbiAgICAgICAgICAgICBUaGVuLCB3ZSBjaGVjayBpZiBhIGNhbGxiYWNrIGlzIGRlZmluZWQsIGlmIHNvLCB3ZSBydW4gaXQgd2hpbGUgcGFzc2luZyB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgICBmcm9tIHRoZSBzZXJ2ZXIgdG8gaXQuXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgc3dpdGNoKG1ldGhvZC50b1VwcGVyQ2FzZSgpKXtcbiAgICAgICAgICAgICAgICBjYXNlICdHRVQnOlxuICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoYXBpX3VybCtyZXF1ZXN0VHlwZSkuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjaykgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZXJySGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1BPU1QnOlxuICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KGFwaV91cmwrcmVxdWVzdFR5cGUsIHBhcmFtcykuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjaykgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZXJySGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1BVVCc6XG4gICAgICAgICAgICAgICAgICAgICRodHRwLnB1dChhcGlfdXJsK3JlcXVlc3RUeXBlLCBwYXJhbXMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGVyckhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBvciBubyBtZXRob2QgZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMzEvMTRcbiAqIEBuYW1lIG5nc3RvcmFnZVxuICogQGRlc2NcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLypqc2hpbnQgLVcwMzAgKi9cblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG92ZXJ2aWV3XG4gICAgICogQG5hbWUgbmdTdG9yYWdlXG4gICAgICovXG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnbmdTdG9yYWdlJywgW10pLlxuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG9iamVjdFxuICAgICAqIEBuYW1lIG5nU3RvcmFnZS4kbG9jYWxTdG9yYWdlXG4gICAgICogQHJlcXVpcmVzICRyb290U2NvcGVcbiAgICAgKiBAcmVxdWlyZXMgJHdpbmRvd1xuICAgICAqL1xuXG4gICAgICAgIGZhY3RvcnkoJyRsb2NhbFN0b3JhZ2UnLCBfc3RvcmFnZUZhY3RvcnkoJ2xvY2FsU3RvcmFnZScpKS5cblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBvYmplY3RcbiAgICAgKiBAbmFtZSBuZ1N0b3JhZ2UuJHNlc3Npb25TdG9yYWdlXG4gICAgICogQHJlcXVpcmVzICRyb290U2NvcGVcbiAgICAgKiBAcmVxdWlyZXMgJHdpbmRvd1xuICAgICAqL1xuXG4gICAgICAgIGZhY3RvcnkoJyRzZXNzaW9uU3RvcmFnZScsIF9zdG9yYWdlRmFjdG9yeSgnc2Vzc2lvblN0b3JhZ2UnKSk7XG5cbiAgICBmdW5jdGlvbiBfc3RvcmFnZUZhY3Rvcnkoc3RvcmFnZVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICckcm9vdFNjb3BlJyxcbiAgICAgICAgICAgICckd2luZG93JyxcblxuICAgICAgICAgICAgZnVuY3Rpb24oXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZSxcbiAgICAgICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAvLyAjOTogQXNzaWduIGEgcGxhY2Vob2xkZXIgb2JqZWN0IGlmIFdlYiBTdG9yYWdlIGlzIHVuYXZhaWxhYmxlIHRvIHByZXZlbnQgYnJlYWtpbmcgdGhlIGVudGlyZSBBbmd1bGFySlMgYXBwXG4gICAgICAgICAgICAgICAgdmFyIHdlYlN0b3JhZ2UgPSAkd2luZG93W3N0b3JhZ2VUeXBlXSB8fCAoY29uc29sZS53YXJuKCdUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBXZWIgU3RvcmFnZSEnKSwge30pLFxuICAgICAgICAgICAgICAgICAgICAkc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkZWZhdWx0OiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5pc0RlZmluZWQoJHN0b3JhZ2Vba10pIHx8ICgkc3RvcmFnZVtrXSA9IGl0ZW1zW2tdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgJHJlc2V0OiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gJHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyQnID09PSBrWzBdIHx8IGRlbGV0ZSAkc3RvcmFnZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2UuJGRlZmF1bHQoaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlLFxuICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2U7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgazsgaSA8IHdlYlN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gIzgsICMxMDogYHdlYlN0b3JhZ2Uua2V5KGkpYCBtYXkgYmUgYW4gZW1wdHkgc3RyaW5nIChvciB0aHJvdyBhbiBleGNlcHRpb24gaW4gSUU5IGlmIGB3ZWJTdG9yYWdlYCBpcyBlbXB0eSlcbiAgICAgICAgICAgICAgICAgICAgKGsgPSB3ZWJTdG9yYWdlLmtleShpKSkgJiYgJ25nU3RvcmFnZS0nID09PSBrLnNsaWNlKDAsIDEwKSAmJiAoJHN0b3JhZ2Vbay5zbGljZSgxMCldID0gYW5ndWxhci5mcm9tSnNvbih3ZWJTdG9yYWdlLmdldEl0ZW0oaykpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlID0gYW5ndWxhci5jb3B5KCRzdG9yYWdlKTtcblxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2UgfHwgKF9kZWJvdW5jZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2UgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKCRzdG9yYWdlLCBfbGFzdCRzdG9yYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkc3RvcmFnZSwgZnVuY3Rpb24odiwgaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmlzRGVmaW5lZCh2KSAmJiAnJCcgIT09IGtbMF0gJiYgd2ViU3RvcmFnZS5zZXRJdGVtKCduZ1N0b3JhZ2UtJyArIGssIGFuZ3VsYXIudG9Kc29uKHYpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgX2xhc3Qkc3RvcmFnZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gX2xhc3Qkc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJTdG9yYWdlLnJlbW92ZUl0ZW0oJ25nU3RvcmFnZS0nICsgayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2xhc3Qkc3RvcmFnZSA9IGFuZ3VsYXIuY29weSgkc3RvcmFnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gIzY6IFVzZSBgJHdpbmRvdy5hZGRFdmVudExpc3RlbmVyYCBpbnN0ZWFkIG9mIGBhbmd1bGFyLmVsZW1lbnRgIHRvIGF2b2lkIHRoZSBqUXVlcnktc3BlY2lmaWMgYGV2ZW50Lm9yaWdpbmFsRXZlbnRgXG4gICAgICAgICAgICAgICAgJ2xvY2FsU3RvcmFnZScgPT09IHN0b3JhZ2VUeXBlICYmICR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAmJiAkd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ25nU3RvcmFnZS0nID09PSBldmVudC5rZXkuc2xpY2UoMCwgMTApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5uZXdWYWx1ZSA/ICRzdG9yYWdlW2V2ZW50LmtleS5zbGljZSgxMCldID0gYW5ndWxhci5mcm9tSnNvbihldmVudC5uZXdWYWx1ZSkgOiBkZWxldGUgJHN0b3JhZ2VbZXZlbnQua2V5LnNsaWNlKDEwKV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIF9sYXN0JHN0b3JhZ2UgPSBhbmd1bGFyLmNvcHkoJHN0b3JhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLy9TZXJ2aWNlIHRvIGhhbmRsZSBkaXNwbGF5aW5nIHVzZXIgbWVzc2FnZXNcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS5cbmRpcmVjdGl2ZSgndXNlck1lc3NhZ2UnLCBmdW5jdGlvbihNZXNzYWdlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgIHRleHQ6ICc9dGV4dCcsXG4gICAgICAgICAgICB0eXBlOiAnPXR5cGUnXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coTWVzc2FnZS5nZXRNZXNzYWdlVGV4dCgpKTtcbiAgICAgICAgICAgIHNjb3BlLnRleHQgPSBNZXNzYWdlLmdldE1lc3NhZ2VUZXh0KCk7XG4gICAgICAgICAgICBzY29wZS50eXBlID0gTWVzc2FnZS5nZXRNZXNzYWdlVHlwZSgpO1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL21lc3NhZ2UvbWVzc2FnZS5odG1sJ1xuXG4gICAgfTtcbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBEcmFmdEN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIERyYWZ0IHBhZ2VcbiAqL1xuLyogZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ0RyYWZ0Q29udHJvbGxlcicsIGZ1bmN0aW9uIChBUEksICRzY29wZSl7XG4gICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy9kcmFmdCcpO1xuICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIGRyYWZ0IHN0YXR1c1xuXG4gICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgdHJ5e1xuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgICAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgICAgICAvLyNjYXNlcy10YWJsZSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgY2FzZXMsIHNvIHdlIGFyZSBzZXR0aW5nIGl0J3MgSFRNTCBlcXVhbCB0byB0aGUgZGlzcGxheSBtZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIEhlbHBlcnMuc2hvd01lc3NhZ2VBcmVhKCcjY2FzZXMtdGFibGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJyQkTm9DYXNlc01lc3NhZ2UkJCcsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9Y2F0Y2goZSl7XG4gICAgICAgICAgICBIZWxwZXJzLnNob3dNZXNzYWdlQXJlYSgnI2Nhc2VzLXRhYmxlJyxcbiAgICAgICAgICAgICAgICAnVGhlcmUgaGFzIGJlZW4gYSBwcm9ibGVtIHdpdGggeW91ciByZXF1ZXN0LiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicrXG4gICAgICAgICAgICAgICAgJ1xcbicrXG4gICAgICAgICAgICAgICAgJzwvcD48cD4nK1xuICAgICAgICAgICAgICAgICdFcnJvciBNZXNzYWdlOiA8cHJlPicrIEpTT04uc3RyaW5naWZ5KGUsIG51bGwsICdcXHQnKStcbiAgICAgICAgICAgICAgICAnPC9wcmU+PC9wPicsIHRydWUpO1xuICAgICAgICB9XG5cblxufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIER5bmFmb3JtQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgRHluYWZvcm1cbiAqL1xuLypnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4gICAgLmNvbnRyb2xsZXIoJ0R5bmFmb3JtQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgJHN0YXRlLCAkbG9jYWxTdG9yYWdlLCBBUEksIE1lc3NhZ2UsIEhlbHBlcnMpIHtcblxuICAgICAgICAvL0luc3RhbnRpYXRlIHRoZSBkeW5hZm9ybSBvYmplY3Qgc28gdGhhdCB3ZSBjYW4gYXNzaWduIHByb3BlcnRpZXMgdG8gaXRcbiAgICAgICAgJHNjb3BlLmR5bmFmb3JtID0ge307XG5cbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL2FjdGl2aXR5LycrJGxvY2FsU3RvcmFnZS5hY3RfdWlkKycvc3RlcHMnKTtcbiAgICAgICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2Ygc3RlcHNcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgLy9HZXQgdGhlIGZpcnN0IG9iamVjdC9mb3JtIGZvciB0aGUgZGVtbyBhcHBsaWNhdGlvblxuICAgICAgICAgICAgLy9JbiBhIHJlYWwgd29ybGQgZXhhbXBsZSB5b3Ugd291bGQgaGF2ZSB0byBidWlsZCBsb2dpYyBhdCB0aGlzIHBvaW50IHRvXG4gICAgICAgICAgICAvL0NoZWNrIGlmIHRoZXJlIGlzIGEgZm9ybSBhc3NvY2lhdGVkIHdpdGggdGhpcyBzdGVwXG4gICAgICAgICAgICBpZiggISByZXNwb25zZS5kYXRhLmxlbmd0aCA+IDAgKXtcbiAgICAgICAgICAgICAgICBNZXNzYWdlLnNldE1lc3NhZ2VUeXBlKCdkYW5nZXInKTtcbiAgICAgICAgICAgICAgICBNZXNzYWdlLnNldE1lc3NhZ2VUZXh0KCckJE5vU3RlcFRvRGlzcGxheSQkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygnYXBwLmhvbWUnKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9EaXNwbGF5IHRoZSBhcHByb3ByaWF0ZSBzdGVwc1xuICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGR5bmFmb3JtIHVpZCAvIHN0ZXAgdWlkIHRvIGxvY2FsU3RvcmFnZSBmb3IgcGVyc2lzdGVuY2VcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2Uuc3RlcF91aWRfb2JqID0gcmVzcG9uc2UuZGF0YVswXS5zdGVwX3VpZF9vYmo7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL2R5bmFmb3JtLycrJGxvY2FsU3RvcmFnZS5zdGVwX3VpZF9vYmopO1xuICAgICAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSByZXF1ZXN0aW5nIGR5bmFmb3JtIGRlZmluaXRpb24gaW4gb3JkZXIgdG8gcmVuZGVyIHRoZSBmb3JtXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGR5bmFmb3JtQ29udGVudCA9IEpTT04ucGFyc2UocmVzcG9uc2UuZGF0YS5keW5fY29udGVudCk7XG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5keW5fdWlkID0gcmVzcG9uc2UuZGF0YS5keW5fdWlkO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5tYWluVGl0bGUgPSByZXNwb25zZS5kYXRhLmR5bl90aXRsZTtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRzID0gZHluYWZvcm1Db250ZW50Lml0ZW1zWzBdLml0ZW1zO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5hcHBfbnVtYmVyID0gJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5maWVsZHMgPSBmaWVsZHM7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmR5bmFmb3JtLnN1Ym1pdCA9IGZpZWxkc1tmaWVsZHMubGVuZ3RoLTFdWzBdO1xuICAgICAgICAgICAgICAgICRzY29wZS5sb2FkQ2FzZURhdGEoKTtcbiAgICAgICAgICAgIH0sICdHRVQnLCB1bmRlZmluZWQsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIEhlbHBlcnMuc2hvd01lc3NhZ2VBcmVhKCcjc3RhcnQtY2FzZS1hcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgJ1RoZXJlIGhhcyBiZWVuIGEgcHJvYmxlbSB3aXRoIHlvdXIgcmVxdWVzdC4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nK1xuICAgICAgICAgICAgICAgICAgICAnPC9wPjxwPicrXG4gICAgICAgICAgICAgICAgICAgICdFcnJvciBNZXNzYWdlOiA8cHJlPicrIEpTT04uc3RyaW5naWZ5KGUsIG51bGwsICdcXHQnKStcbiAgICAgICAgICAgICAgICAgICAgJzwvcHJlPjwvcD4nLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIHN1Ym1pdENhc2VcbiAgICAgICAgICogQGRlc2MgU3VibWl0cyB0aGUgZm9ybSB0byBQcm9jZXNzTWFrZXIgdG8gc2F2ZSB0aGUgZGF0YSBhbmQgdGFrZXMgdGhlIHVzZXIgYmFjayB0byB0aGVpciBpbmJveFxuICAgICAgICAgKi9cblxuICAgICAgICAkc2NvcGUuc3VibWl0Q2FzZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvL1NldCB0aGUgZGVsZWdhdGlvbiBpbmRleCBlcXVhbCB0byAxIGlmIHRoZXJlIGlzIG5vIGRlbGVnYXRpb24gaW5kZXgsIHRoaXMgd291bGQgbWVhbiB0aGF0IHRoZSBjYXNlIGlzXG4gICAgICAgICAgICAvL0N1cnJlbnRseSBpbiBkcmFmdCBzdGF0dXMsIG90aGVyd2lzZSwgaWYgdGhlIGRlbGVnYXRpb24gaXMgbm90IG51bGwsIGp1c3QgYXNzaWduIGl0IHZhbHVlIG9mIHRoZSBkZWxlZ2F0aW9uXG4gICAgICAgICAgICAvL2luZGV4XG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmRlbEluZGV4ID0gKCRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPT09IG51bGwpID8gMSA6ICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXg7XG4gICAgICAgICAgICAvL0luc3RhbnRpYXRlIGFuIG9iamVjdCBpbiBvcmRlciB0byB1c2UgdG8gY3JlYXRlIHRoZSBvYmplY3QgdGhhdCB3ZSB3aWxsIGJlIHNlbmRpbmcgdG8gUHJvY2Vzc01ha2VyXG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJyskbG9jYWxTdG9yYWdlLmFwcF91aWQrJy92YXJpYWJsZScpO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHB1dCByZXF1ZXN0XG4gICAgICAgICAgICBBUEkuc2V0UGFyYW1zKCRzY29wZS5maWVsZERhdGEpO1xuICAgICAgICAgICAgLy9NYWtlIGEgY2FsbCB0byB0aGUgQVBJIHRvIHN1Ym1pdCB0aGUgZGF0YSB0byBiZSBzYXZlZCB0byB0aGUgY2FzZXMgdmFyaWFibGVzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3BvbnNlIGlzIG5vdCBlcXVhbCB0byAwIHRoYW4gd2Uga25vdyB0aGUgcmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZSE9PTApe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrJGxvY2FsU3RvcmFnZS5hcHBfdWlkKycvcm91dGUtY2FzZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHB1dCByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkuc2V0UGFyYW1zKHsnZGVsX2luZGV4JzogJGxvY2FsU3RvcmFnZS5kZWxJbmRleCwgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTgnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL01ha2UgYSBjYWxsIHRvIHRoZSBBUEkgdG8gcm91dGUgdGhlIGNhc2UgdG8gdGhlIG5leHQgdGFza1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9Tb21ldGhpbmcgdG8gbm90ZSBmb3IgcHJvZHVjdGlvbiBlbnZpcm9ubWVudHM6XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1RoaXMgc3BlY2lmaWMgd29ya2Zsb3cgd2FzIGEgc2VxdWVudGlhbCB3b3JrZmxvdy4gRm9yIHByb2R1Y3Rpb24gZW52aXJvbmVtbnRzIHlvdSBtYXkgbmVlZCB0byBhZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQ3VzdG9tIGxvZ2ljIGZvciBpbnRlcnByZXRpbmcgdGhlIHJvdXRpbmcgcHJvY2VkdXJlIGZvciBvdGhlciB0eXBlcyBvZiByb3V0aW5nIHJ1bGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1Jlc2V0IHRoZSBkZWxlZ2F0aW9uIGluZGV4IHNpbmNlIHdlIGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1Jlc2V0IHRoZSBhcHBsaWNhdGlvbnMgdW5pcXVlIGlkZW50aWZpZXIgc2luY2Ugd2UgaGF2ZSBzdWJtaXR0ZWQgdGhlIGZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9TZW5kIHRoZSB1c2VyIGJhY2sgdG8gdGhlaXIgaG9tZSBpbmJveCBzaW5jZSB0aGV5IGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi51cmwoJy9ob21lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vRGlzcGxheSBhIHVzZXIgZnJpZW5kbHkgbWVzc2FnZSB0byB0aGUgdXNlciB0aGF0IHRoZXkgaGF2ZSBzdWNjZXNzZnVsbHkgc3VibWl0dGVkIHRoZSBjYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1lc3NhZ2Uuc2V0TWVzc2FnZVRleHQoJyQkRm9ybVN1Ym1pdHRlZE1lc3NhZ2UkJCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZXNzYWdlLnNldE1lc3NhZ2VUeXBlKCdzdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBVVFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQVVQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy9EZWZpbmUgdGhlIHJlcXVlc3QgdHlwZSwgaW4gdGhpcyBjYXNlLCBQVVRcbiAgICAgICAgICAgICAgICAnUFVUJyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgbG9hZENhc2VEYXRhXG4gICAgICAgICAqIEBkZXNjIExvYWRzIHRoZSBkYXRhIGZyb20gdGhlIGNhc2UgYW5kIHBvcHVsYXRlcyB0aGUgZm9ybSB3aXRoIGl0XG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUubG9hZENhc2VEYXRhID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy8nKyRsb2NhbFN0b3JhZ2UuYXBwX3VpZCsnL3ZhcmlhYmxlcycpO1xuICAgICAgICAgICAgLy9NYWtlIGEgY2FsbCB0byB0aGUgQVBJIHJlcXVlc3RpbmcgdGhlIGRhdGEgb2YgdGhlIGNhc2VcbiAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAvL0lmIHRoZSBsZW5ndGggb2YgdGhlIGRhdGEgaXMgZ3JlYXRlciB0aGFuIDAsIHdlIGtub3cgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBpZigkKHJlc3BvbnNlLmRhdGEpLnNpemUoKSA+IDApe1xuICAgICAgICAgICAgICAgICAgICAvL0Fzc2lnbiB0aGUgcmVzcG9uc2UgdG8gYSB2YXJpYWJsZSBmb3IgZWFzaWVyIHVzZVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZmllbGREYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBIb21lQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgSG9tZSBwYWdlXG4gKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJGxvY2FsU3RvcmFnZSwgTWVzc2FnZSl7XG4gICAgLy9DaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpblxuICAgIGlmKCAhICRzY29wZS5hdXRoZW50aWNhdGVkKCkgKXtcbiAgICAgICAgLy9EaXNwbGF5IHRoZSBkZWZhdWx0IG1lc3NhZ2VcbiAgICAgICAgTWVzc2FnZS5zZXRNZXNzYWdlVGV4dCgnJCREZWZhdWx0V2VsY29tZU1lc3NhZ2UkJCcpO1xuICAgICAgICBNZXNzYWdlLnNldE1lc3NhZ2VUeXBlKCd3YXJuaW5nJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgSW5ib3hDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBJbmJveCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdJbmJveENvbnRyb2xsZXInLCBmdW5jdGlvbiAoQVBJLCAkc2NvcGUpe1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcycpO1xuICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiBUbyBEbyBzdGF0dXNcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgdGhlIHZpZXcgd2l0aCB0aGUgZGF0YVxuICAgICAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAvL0lmIHRoZSByZXN1bHRpbmcgZGF0YSBsZW5ndGggaXMgZXF1YWwgdG8gMCwgdGhlbiB3ZSBkaXNwbGF5IGEgdXNlciBmcmllbmRseVxuICAgICAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAgICAgLy8jY2FzZXMtdGFibGUgaXMgdGhlIGFyZWEgb24gdGhlIHBhZ2Ugd2UgYXJlIHJlbmRlcmluZ1xuICAgICAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgY2FzZXMsIHNvIHdlIGFyZSBzZXR0aW5nIGl0J3MgSFRNTCBlcXVhbCB0byB0aGUgZGlzcGxheSBtZXNzYWdlXG4gICAgICAgICAgICAgICAgSGVscGVycy5zaG93TWVzc2FnZUFyZWEoJyNjYXNlcy10YWJsZScsXG4gICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIE5ld2Nhc2VDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBOZXcgQ2FzZSBwYWdlXG4gKi9cbi8qZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ05ld2Nhc2VDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzdGF0ZSwgJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCBBUEkpe1xuICAgICAgICAvL0Fzc2lnbiB0aGUgbGlzdCBvZiBzdGFydGluZyB0YXNrcyBmcm9tIGxvY2FsU3RvcmFnZSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGluIHRoZSB2aWV3XG4gICAgICAgICRzY29wZS50YXNrTGlzdCA9ICRsb2NhbFN0b3JhZ2Uuc3RhcnRpbmdUYXNrcztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzdGFydENhc2VcbiAgICAgICAgICogQGRlc2MgU3RhcnRzIGEgbmV3IGNhc2UgaW4gUHJvY2Vzc01ha2VyXG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUuc3RhcnRDYXNlID0gZnVuY3Rpb24oYWN0X3VpZCl7XG4gICAgICAgICAgICAvL1NldHRpbmcgdGhlIGFjdGl2aXR5IHVpZCB0byBsb2NhbFN0b3JhZ2UgZm9yIGxhdGVyIHVzZVxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hY3RfdWlkID0gYWN0X3VpZDtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcycpO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHBvc3QgcmVxdWVzdFxuICAgICAgICAgICAgQVBJLnNldFBhcmFtcyh7cHJvX3VpZDogJGxvY2FsU3RvcmFnZS5wcm9fdWlkLCB0YXNfdWlkOiAkbG9jYWxTdG9yYWdlLmFjdF91aWR9KTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIFJFU1QgQVBJIHRvIHN0YXJ0IGEgY2FzZVxuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaXMgZ3JlYXRlciB0aGFuIDAsIHRoZW4gd2Uga25vdyB3ZSdyZSBpbiBidXNpbmVzcyFcbiAgICAgICAgICAgICAgICBpZiggJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwICl7XG4gICAgICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgdXNlciB0byB0aGUgb3BlbmNhc2UgcGFnZSwgdGhlcmUgd2UgZGlzcGxheSB0aGUgZHluYWZvcm1cbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAub3BlbmNhc2UnKTtcbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIGxvY2FsU3RvcmFnZSBhcHBsaWNhdGlvbiB1bmlxdWUgaWRlbnRpZmllciB0byB0aGF0IHdoaWNoIHdhcyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gcmVzcG9uc2UuZGF0YS5hcHBfdWlkO1xuICAgICAgICAgICAgICAgICAgICAvL1NldCB0aGUgbG9jYWxTdG9yYWdlIGFwcGxpY2F0aW9uIG51bWJlciB0byB0aGF0IHdoaWNoIHdhcyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyID0gcmVzcG9uc2UuZGF0YS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBPU1RcbiAgICAgICAgICAgICdQT1NUJyk7XG4gICAgICAgIH07XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgTmV3cHJvY2Vzc0N0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIE5ldyBQcm9jZXNzIFBhZ2VcbiAqL1xuLypnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignTmV3cHJvY2Vzc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsICRodHRwLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UsIEFQSSwgSGVscGVycyl7XG4gICAgICAgIFxuICAgICAgICAkc2NvcGUuZ2V0UHJvY2Vzc0xpc3QgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3QnKTtcbiAgICAgICAgICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBwcm9jZXNzZXNcbiAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAvL0lmIHRoZSByZXN1bHRpbmcgZGF0YSBsZW5ndGggaXMgZXF1YWwgdG8gMCwgdGhlbiB3ZSBkaXNwbGF5IGEgdXNlciBmcmllbmRseVxuICAgICAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgICAgICAgICAgLy8jbmV3LXByb2Nlc3MtYXJlYSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgcHJvY2Vzc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSGVscGVycy5zaG93TWVzc2FnZUFyZWEoJyNuZXctcHJvY2Vzcy1hcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vUHJvY2Vzc2VzVG9EaXNwbGF5TWVzc2FnZSQkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZVxuICAgICAgICAgICAgICAgIC8vQ2FuIHJlbmRlciB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICRzY29wZS5wcm9MaXN0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSgpOy8vV2UgYXV0byBpbnN0YW50aWF0ZSB0aGUgbWV0aG9kIGluIG9yZGVyIHRvIGhhdmUgaXQgZ2V0IHRoZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBBUEkgYW5kIGRpc3BsYXkgb24gbG9hZCBvZiB0aGUgY29udHJvbGxlclxuXG4gICAgICAgIC8vVGhpcyBtZXRob2Qgc3RhcnRzIGEgcHJvY2VzcyBhbmQgZ2V0cyB0aGUgYXNzb2NpYXRlZCBzdGFydGluZyB0YXNrcyBvZiB0aGUgcHJvY2VzcyBhbmQgZGlzcGxheXMgdGhlbVxuICAgICAgICAvL0l0IHRha2VzIG9uZSBwYXJhbSwgdGhlIHByb2Nlc3MgdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB3ZSB3YW50IHRvIHN0YXJ0XG4gICAgICAgICRzY29wZS5zdGFydFByb2Nlc3MgPSBmdW5jdGlvbihwcm9fdWlkKXtcbiAgICAgICAgICAgIC8vU2V0dGluZyB0aGUgcHJvY2VzcyB1aWQgdG8gbG9jYWxTdG9yYWdlIGZvciBsYXRlciB1c2VcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UucHJvX3VpZCA9IHByb191aWQ7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL3N0YXJ0aW5nLXRhc2tzJyk7XG4gICAgICAgICAgICAvL0NhbGwgdG8gdGhlIFJFU1QgQVBJIHRvIGxpc3QgYWxsIGF2YWlsYWJsZSBzdGFydGluZyB0YXNrcyBmb3IgdGhlIHNwZWNpZmllZCBwcm9jZXNzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9TZW5kIHRoZSBsaXN0IG9mIG5ldyBjYXNlcyB0byBsb2NhbFN0b3JhZ2Ugc28gdGhhdCB0aGUgTmV3Y2FzZUN0cmwgY29udHJvbGxlciBjYW4gdXNlIGl0XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgICAgICAvL01lc3NhZ2Ugc3RhdGluZyB0aGF0IHRoZXJlIGlzIG5vdGhpbmcgdG8gZGlzcGxheVxuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAgICAgICAgIC8vI25ldy1wcm9jZXNzLWFyZWEgaXMgdGhlIGFyZWEgb24gdGhlIHBhZ2Ugd2UgYXJlIHJlbmRlcmluZ1xuICAgICAgICAgICAgICAgICAgICAvL1RoZSBsaXN0IG9mIHByb2Nlc3Nlcywgc28gd2UgYXJlIHNldHRpbmcgaXQncyBIVE1MIGVxdWFsIHRvIHRoZSBkaXNwbGF5IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEhlbHBlcnMuc2hvd01lc3NhZ2VBcmVhKCcjbmV3LXByb2Nlc3MtYXJlYScsXG4gICAgICAgICAgICAgICAgICAgICAgICAnJCROb1N0YXJ0aW5nVGFza3NUb0Rpc3BsYXlNZXNzYWdlJCQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5zdGFydGluZ1Rhc2tzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAvL0NoYW5nZSB0aGUgdXJsIHNvIHRoYXQgdGhlIG5ldyBjYXNlIHBhZ2UgaXMgZGlzcGxheWVkXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhcHAubmV3Y2FzZScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIFBhcnRpY2lwYXRlZEN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIFBhcnRpY2lwYXRlZCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdQYXJ0aWNpcGF0ZWRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgQVBJKSB7XG4gICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy9wYXJ0aWNpcGF0ZWQnKTtcbiAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiBwYXJ0aWNpcGF0ZWQgc3RhdHVzXG4gICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAvL0Fzc2lnbiB0aGUgZGF0YSByZWNlaXZlZCBmcm9tIHRoZSBBUEkgdG8gdGhlIHNjb3BlIHNvIHRoYXQgd2UgY2FuIHJlbmRlciB0aGUgdmlldyB3aXRoIHRoZSBkYXRhXG4gICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAvL0lmIHRoZSByZXN1bHRpbmcgZGF0YSBsZW5ndGggaXMgZXF1YWwgdG8gMCwgdGhlbiB3ZSBkaXNwbGF5IGEgdXNlciBmcmllbmRseVxuICAgICAgICAvL01lc3NhZ2Ugc3RhdGluZyB0aGF0IHRoZXJlIGlzIG5vdGhpbmcgdG8gZGlzcGxheVxuICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgLy8jY2FzZXMtdGFibGUgaXMgdGhlIGFyZWEgb24gdGhlIHBhZ2Ugd2UgYXJlIHJlbmRlcmluZ1xuICAgICAgICAgICAgLy9UaGUgbGlzdCBvZiBjYXNlcywgc28gd2UgYXJlIHNldHRpbmcgaXQncyBIVE1MIGVxdWFsIHRvIHRoZSBkaXNwbGF5IG1lc3NhZ2VcbiAgICAgICAgICAgIEhlbHBlcnMuc2hvd01lc3NhZ2VBcmVhKCcjY2FzZXMtdGFibGUnLFxuICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIFJvb3RDdHJsXG4gKiBAZGVzYyBUaGlzIGlzIHRoZSByb290IGNvbnRyb2xsZXIuIEl0IGNvbnRyb2xzIGFzcGVjdHMgcmVsYXRlZCB0byB0aGUgYXBwbGljYXRpb24gZnJvbSBhIGhpZ2hlciBsZXZlbFxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdSb290Q29udHJvbGxlcicsIGZ1bmN0aW9uIFJvb3RDdHJsKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCAkc3RhdGUsICRodHRwLCBBUEksIE1lc3NhZ2UsIGFwcFRpdGxlLCBnZW5lcmljSGVhZGVycywgYWN0aXZlTWVudUl0ZW1zLCBhcGlfdXJsLCBBY2Nlc3NUb2tlbil7XG4gICAgLy9EZWZpbmUgdGhlIGNvbHVtbiBuYW1lcyBmb3IgdGhlIGdyaWRzLiBJbiB0aGlzIGNhc2UsIHdlIGFyZSBjcmVhdGluZyBnbG9iYWwgY29sdW1ucywgYnV0IHlvdSBjb3VsZCBqdXN0IHJlZGVmaW5lIHRoaXMgYXJyYXkgb24gYW55IGNvbnRyb2xsZXJcbiAgICAvL1RvIG92ZXJ3cml0ZSB0aGVtIGZvciBhIHNwZWNpZmljIHBhZ2VcbiAgICAkc2NvcGUuZ3JpZEhlYWRlcnMgPSBnZW5lcmljSGVhZGVycztcbiAgICAvL0RlZmluZSB0aGUgYXBwbGljYXRpb24gdGl0bGUgYW5kIHNldCBpdCB0byB0aGUgc2NvcGUgc28gdGhhdCB0aGUgdmlldyByZW5kZXJzIGl0XG4gICAgJHNjb3BlLmFwcFRpdGxlID0gYXBwVGl0bGU7XG4gICAgLy9UaGlzIGZ1bmN0aW9uIHNldHMgdGhlIHNpZGViYXIgbWVudSB0byBhY3RpdmUgYmFzZWQgb24gdGhlIHBhZ2Ugc2VsZWN0ZWRcbiAgICAkc2NvcGUuc2V0U2VsZWN0ZWRQYWdlID0gZnVuY3Rpb24oY3VycmVudFBhZ2Upe1xuICAgICAgICAvL0xpc3Qgb2YgYWxsIHRoZSBtZW51IGl0ZW1zIHNvIHRoYXQgd2UgY2FuIGxvb3AgdGhyb3VnaCB0aGVtXG4gICAgICAgIHZhciBsaXN0ID0gYWN0aXZlTWVudUl0ZW1zO1xuICAgICAgICAvL0xvb3AgdGhyb3VnaCBhbGwgdGhlIG1lbnUgaXRlbXNcbiAgICAgICAgJC5lYWNoKGxpc3QsIGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICAgICAgICAgICAgLy9DaGVjayBpZiB0aGUgY3VycmVudCBwYWdlIGlzIGVxdWFsIGEga2V5XG4gICAgICAgICAgICAvL0lmIGl0IGlzLCBtYWtlIGl0IGFjdGl2ZVxuICAgICAgICAgICAgaWYoY3VycmVudFBhZ2UgPT09IGtleSkgJHNjb3BlW3ZhbHVlXSA9ICdhY3RpdmUnO1xuICAgICAgICAgICAgLy9PdGhlcndpc2UsIG1ha2UgdGhlIHJlc3Qgb2YgdGhlbSBpbmFjdGl2ZSBzbyBvbmx5IHRoZSBjdXJyZW50bHkgYWN0aXZlIG9uZSBpcyBkaXNwbGF5ZWQgYXMgYWN0aXZlXG4gICAgICAgICAgICBlbHNlICRzY29wZVt2YWx1ZV0gPSAnJztcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuYW1lICEhIUV2ZW50cyEhIVxuICAgICAgICAgKiBAZGVzYyBUaGlzIGlzIHdoZXJlIHdlIHdpbGwgZGVmaW5lIGEgYnVuY2ggb2YgZXZlbnRzIGFuZCB3aGF0IGhhcHBlbnMgZHVyaW5nIHRob3NlIGV2ZW50c1xuICAgICAgICAgKiBAZGVzYyBGdW4gc3R1ZmYhISEhXG4gICAgICAgICAqL1xuICAgIC8vV2hlbiB0aGUgYXBwbGljYXRpb25zIHN0YXRlIGhhcyBjaGFuZ2VkIHRvIGFub3RoZXIgcm91dGUsIHdlIHdhbnQgdG8gZmlyZSBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKXtcbiAgICAgICAgLy9DaGFuZ2UgdGhlIG1lbnUgaXRlbSBzZWxlY3RlZCBhcyBhY3RpdmUgd2hlbmV2ZXIgdGhlIHBhZ2UgaXMgY2hhbmdlZFxuICAgICAgICAkc2NvcGUuc2V0U2VsZWN0ZWRQYWdlKHRvU3RhdGUuY3VycmVudFBhZ2UpO1xuICAgICAgICAvL1NldCB0aGUgY3VycmVudCBwYWdlcyBuYW1lIHRvIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gdG9TdGF0ZS5jdXJyZW50UGFnZTtcbiAgICAgICAgLy9TZXQgdGhlIGN1cnJlbnQgcGFnZXMgZGVzY3JpcHRpb24gdG8gdGhlIGN1cnJlbnQgcGFnZXMgZGVzY3JpcHRpb25cbiAgICAgICAgJHNjb3BlLnBhZ2VEZXNjID0gdG9TdGF0ZS5wYWdlRGVzYztcbiAgICAgICAgLy9XZSB3YW50IHRvIGRlc3Ryb3kgdGhlIGRlbGVnYXRpb24gaW5kZXggaWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3QgYSBkeW5hZm9ybSBzbyB0aGF0IHRoZSBuZXh0IHRpbWVcbiAgICAgICAgLy9XZSBsb2FkIGEgcGFnZSwgaXQgZG9lcyBub3QgdXNlIGEgZGVsZWdhdGlvbiBpbmRleCBvZiBhIGRpZmZlcmVudCBhcHBsaWNhdGlvblxuICAgICAgICBpZigkc2NvcGUuY3VycmVudFBhZ2UgIT09ICdEeW5hZm9ybScpICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBudWxsO1xuICAgICAgICAvL0R1cmluZyB0aGUgYXV0aGVudGljYXRpb24gcHJvY2VzcyB0aGUgaHR0cCBoZWFkZXJzIGNvdWxkIGhhdmUgY2hhbmdlZCB0byBCYXNpY1xuICAgICAgICAvL1NvIHdlIGp1c3QgcmVpbmZvcmNlIHRoZSBoZWFkZXJzIHdpdGggdGhlIEJlYXJlciBhdXRob3JpemF0aW9uIGFzIHdlbGwgYXMgdGhlIHVwZGF0ZWQgYWNjZXNzX3Rva2VuXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLkF1dGhvcml6YXRpb24gPSAnQmVhcmVyICcgKyAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuO1xuICAgIH0pO1xuICAgIC8vV2hlbiB0aGUgdXNlciBsb2dzIGluLCB3ZSBkbyBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHJvb3RTY29wZS4kb24oJ29hdXRoOmxvZ2luJywgZnVuY3Rpb24oZXZlbnQsIHRva2VuKXtcbiAgICAgICAgLy9UaGlzIGlzIEVYVFJFTUVMWSBpbXBvcnRhbnQgLSBUaGUgd2hvbGUgVUkgaXMgcmVuZGVyZWQgYmFzZWQgb24gaWYgdGhpcyBpcyBhbiBhY2Nlc3NfdG9rZW5cbiAgICAgICAgLy9Tbywgd2UgYXNzaWduIHRoZSBzY29wZXMgYWNjZXNzVG9rZW4gdG8gdGhlIHRva2VuXG4gICAgICAgIC8vSWYgdGhlIHVzZXIgaXMgbm90IGxvZ2dlZCBpbiwgdGhlIHRva2VuIG9iamVjdCB3aWxsIGJlIHVuZGVmaW5lZFxuICAgICAgICAvL0lmIHRoZSB1c2VyIElTIGxvZ2dlZCBpbiwgdGhlIHRva2VuIG9iamVjdCB3aWxsIGhvbGQgdGhlIHRva2VuIGluZm9ybWF0aW9uXG4gICAgICAgIC8vRS5nLiBhY2Nlc3NfdG9rZW4sIHJlZnJlc2hfdG9rZW4sIGV4cGlyeSBldGNcbiAgICAgICAgJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbiA9IHRva2VuLmFjY2Vzc190b2tlbjtcbiAgICAgICAgLy9EaXNwbGF5IHRoZSBkZWZhdWx0IG1lc3NhZ2VcbiAgICAgICAgTWVzc2FnZS5zZXRNZXNzYWdlVGV4dCgnJCRXZWxjb21lTWVzc2FnZSQkJyk7XG4gICAgICAgIE1lc3NhZ2Uuc2V0TWVzc2FnZVR5cGUoJ3N1Y2Nlc3MnKTtcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygnYXBwLmhvbWUnKTtcbiAgICB9KTtcbiAgICAkcm9vdFNjb3BlLiRvbignb2F1dGg6bG9nZ2VkT3V0JywgZnVuY3Rpb24oZXZlbnQsIHRva2VuKXtcbiAgICAgICAgLy9EZXN0cm95IHRoZSBzZXNzaW9uXG4gICAgICAgICRzY29wZS5kZXN0cm95U2Vzc2lvbigpO1xuICAgIH0pO1xuICAgIC8qLy9XaGVuIHRoZSB1c2VyIGxvZ3Mgb3V0LCB3ZSBkbyBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHJvb3RTY29wZS4kb24oJ29hdXRoOmxvZ291dCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vRGVzdHJveSB0aGUgc2Vzc2lvblxuICAgICAgICAkc2NvcGUuZGVzdHJveVNlc3Npb24oKTtcbiAgICB9KTsqL1xuXG4gICAgJHNjb3BlLmRlc3Ryb3lTZXNzaW9uID0gZnVuY3Rpb24oKXtcbiAgICAgICAgLy9UaGUgdXNlciBoYXMgbG9nZ2VkIG91dCwgc28gd2UgZGVzdHJveSB0aGUgYWNjZXNzX3Rva2VuXG4gICAgICAgIC8vQmVjYXVzZSBvZiBBbmd1bGFycyBhd2Vzb21lIGxpdmUgZGF0YSBiaW5kaW5nLCB0aGlzIGF1dG9tYXRpY2FsbHkgcmVuZGVycyB0aGUgdmlldyBpbm5hdGVcbiAgICAgICAgJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbiA9IG51bGw7XG4gICAgICAgIC8vRGVzdG9yeSB0aGUgQWNjZXNzVG9rZW4gb2JqZWN0XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koKTtcbiAgICAgICAgLy9TZXQgdGhlIHBhZ2VzIG5hbWUgdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gJ0hvbWUnO1xuICAgICAgICAvL1NldCB0aGUgcGFnZXMgZGVzY3JpcHRpb24gdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLnBhZ2VEZXNjID0gJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBIb21lIFBhZ2UhJztcbiAgICAgICAgLy9SZWRpcmVjdCB0aGUgdXNlciBiYWNrIHRvIHRoZSBob21lIHBhZ2VcbiAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygnYXBwLmhvbWUnKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAqIEBuYW1lIG9wZW5DYXNlXG4gICAgICogQGRlc2MgT3BlbnMgYSBkeW5hZm9ybSBhbmQgZGlzcGxheXMgdGhlIGRhdGEgZm9yIHRoZSB1c2VyXG4gICAgICogQHBhcmFtIGFwcF91aWQgLSByZXF1aXJlZCAtIHRoZSBhcHBsaWNhdGlvbiB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGNhc2UgeW91IHdpc2ggdG8gb3BlblxuICAgICAqIEBwYXJhbSBkZWxJbmRleCAtIHJlcXVpcmVkIC0gdGhlIGRlbGVnYXRpb24gaW5kZXggb2YgdGhlIGN1cnJlbnQgYXBwbGljYXRpb24gdGhhdCB5b3UgYXJlIG9wZW5pbmdcbiAgICAgKi9cbiAgICAkc2NvcGUub3BlbkNhc2UgPSBmdW5jdGlvbihhcHBfdWlkLCBkZWxJbmRleCl7XG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJythcHBfdWlkKTtcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgaWYoICQocmVzcG9uc2UuZGF0YSkuc2l6ZSgpID4gMCApe1xuICAgICAgICAgICAgICAgIC8vQXNzaWduIHRoZSBsb2NhbFN0b3JhZ2UgZGF0YTpcbiAgICAgICAgICAgICAgICAvL1RoZSBhcHBsaWNhdGlvbnMgbnVtYmVyXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyID0gcmVzcG9uc2UuZGF0YS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgIC8vVGhlIHByb2Nlc3MgdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB0aGUgY2FzZSBpcyBhc3NvY2lhdGVkIHRvXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5wcm9fdWlkID0gcmVzcG9uc2UuZGF0YS5wcm9fdWlkO1xuICAgICAgICAgICAgICAgIC8vVGhlIGFjdGl2aXR5L2Zvcm0gdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB3ZSBhcmUgZ29pbmcgdG8gZGlzcGFseVxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYWN0X3VpZCA9IHJlc3BvbnNlLmRhdGEuY3VycmVudF90YXNrWzBdLnRhc191aWQ7XG4gICAgICAgICAgICAgICAgLy9UaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gYXBwX3VpZDtcbiAgICAgICAgICAgICAgICAvL1RoZSBkZWxlZ2F0aW9uIGluZGV4IG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBkZWxJbmRleDtcbiAgICAgICAgICAgICAgICAvL0NhbGwgdGhlIG9wZW4gY2FzZSBzdGF0ZSBhbmQgdHJhbnNpdGlvbiB0byBpdFxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXBwLm9wZW5jYXNlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbiAmJiAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuLmxlbmd0aCA+IDEpIHJldHVybiB0cnVlO1xuICAgIH1cbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBVbmFzc2lnbmVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgVW5hc3NpZ25lZCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdVbmFzc2lnbmVkQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEFQSSkge1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy91bmFzc2lnbmVkJyk7XG4gICAgICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIHVuYXNzaWduZWQgc3RhdHVzXG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgIC8vI2Nhc2VzLXRhYmxlIGlzIHRoZSBhcmVhIG9uIHRoZSBwYWdlIHdlIGFyZSByZW5kZXJpbmdcbiAgICAgICAgICAgICAgICAvL1RoZSBsaXN0IG9mIGNhc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgICAgIEhlbHBlcnMuc2hvd01lc3NhZ2VBcmVhKCcjY2FzZXMtdGFibGUnLFxuICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==