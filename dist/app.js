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
/**
 * @author ethan@colosa.com
 * @date 7/31/14
 * @name config
 * @desc Configuration file for the pmAngular app
 */

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
/**
 * @author ethan@colosa.com
 * @date 8/31/2015
 * @name AuthorizedCtrl
 * @desc This controls the Home page
 */
'use strict';
angular.module('pmAngular')
.controller('AuthorizedCtrl', function ($scope, $localStorage){
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
 * @name DraftCtrl
 * @desc This controls the Draft page
 */
/* global $:false */
'use strict';
angular.module('pmAngular')
.controller('DraftCtrl', function (API, $scope){
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
.controller('DynaformCtrl', function ($scope, $location, $localStorage, API) {

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
.controller('HomeCtrl', function ($scope, $localStorage){
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
.controller('InboxCtrl', function (API, $scope){
        //Set the requestType
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
.controller('NewcaseCtrl', function ($scope, $http, $location, $localStorage, API){
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
.controller('NewprocessCtrl', function ($rootScope, $scope, $http, $location, $localStorage, API){
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
.controller('ParticipatedCtrl', function ($scope, API) {
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
.controller('RootCtrl', function RootCtrl($rootScope, $scope, $location, $localStorage, $state, $http, API, appTitle, genericHeaders, activeMenuItems, api_url, AccessToken){
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
        $location.url('/home');
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
.controller('UnassignedCtrl', function ($scope, API) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsIm5nLW9hdXRoLmpzIiwiYXBpLmpzIiwibmdzdG9yYWdlLmpzIiwiYXV0aG9yaXplZC5qcyIsImRyYWZ0LmpzIiwiZHluYWZvcm0uanMiLCJob21lLmpzIiwiaW5ib3guanMiLCJuZXdjYXNlLmpzIiwibmV3cHJvY2Vzcy5qcyIsInBhcnRpY2lwYXRlZC5qcyIsInJvb3QuanMiLCJ1bmFzc2lnbmVkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBwbUFuZ3VsYXJBcHBcbiAqIEBkZXNjcmlwdGlvblxuICogIyBwbUFuZ3VsYXIgaXMgYSBuYXRpdmUgQW5ndWxhckpTIGZyb250IGVuZCBpbmJveCB0aGF0IGNvbm5lY3RzIHRvIFByb2Nlc3NNYWtlciAzLjAgUkVTVCBBUEkgd2l0aCBPQXV0aCAyLjBcbiAqXG4gKiBNYWluIG1vZHVsZSBvZiB0aGUgYXBwbGljYXRpb24uXG4gKi9cbi8vQ3JlYXRlIHRoZSBhcHBcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInLCBbXG4gICAgJ29hdXRoJyxcbiAgICAvLyduZ1JvdXRlJywgICAgICAgICAgICAgIC8vYXBwbGljYXRpb24gdmlldyBhbmQgcm91dGluZyBzZXJ2aWNlXG4gICAgJ3VpLmJvb3RzdHJhcCcsICAgICAgICAgIC8vQm9vdHN0cmFwIGZyYW1ld29yayBmb3IgQW5ndWxhckpTXG4gICAgJ3VpLnJvdXRlcidcbl0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzMxLzE0XG4gKiBAbmFtZSBjb25maWdcbiAqIEBkZXNjIENvbmZpZ3VyYXRpb24gZmlsZSBmb3IgdGhlIHBtQW5ndWxhciBhcHBcbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb25maWcoWyckbG9jYXRpb25Qcm92aWRlcicsICckaHR0cFByb3ZpZGVyJywgJyRicm93c2VyUHJvdmlkZXInLCAnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywgZnVuY3Rpb24oJGxvY2F0aW9uUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICRicm93c2VyUHJvdmlkZXIsICRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpe1xuICAgIC8vQ29uZmlndXJlIHRoZSB1cmwgcm91dGVzLCB0aGlzIGlzIGJhc2ljYWxseSB0aGUgbmF2aWdhdGlvbiBvZiB0aGUgYXBwXG4gICAgLy9Gb3IgZWFjaCByb3V0ZSB3ZSBkZWZpbmUgaXQncyBhc3NvY2lhdGVkOiB0ZW1wbGF0ZSwgY29udHJvbGxlciwgdGVtcGxhdGUgdmFyaWFibGVzOiBwYWdlIG5hbWUgYW5kIGRlc2NyaXB0aW9uXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9ob21lJyk7XG5cbiAgICAgICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvaG9tZScsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBIb21lIFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvaG9tZS5odG1sJ1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLnN0YXRlKCduZXdwcm9jZXNzJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9uZXdwcm9jZXNzJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnTmV3cHJvY2Vzc0N0cmwnLFxuICAgICAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIE5ldyBQcm9jZXNzIFBhZ2UhJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZTogJ05ldyBQcm9jZXNzJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25ld3Byb2Nlc3MuaHRtbCdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhdGUoJ25ld2Nhc2UnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL25ld2Nhc2UnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdOZXdjYXNlQ3RybCcsXG4gICAgICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgTmV3IENhc2UgUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnTmV3IENhc2UnLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbmV3Y2FzZS5odG1sJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnb3BlbmNhc2UnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL29wZW5jYXNlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnRHluYWZvcm1DdHJsJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBEeW5hZm9ybSBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdEeW5hZm9ybScsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9keW5hZm9ybS5odG1sJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnaW5ib3gnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL2luYm94JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSW5ib3hDdHJsJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBJbmJveCBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdJbmJveCcsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9pbmJveC5odG1sJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgnZHJhZnQnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnL2RyYWZ0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnRHJhZnRDdHJsJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBEcmFmdCBQYWdlIScsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdEcmFmdCcsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9kcmFmdC5odG1sJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGF0ZSgncGFydGljaXBhdGVkJywge1xuICAgICAgICAgICAgICAgIHVybDogJy9wYXJ0aWNpcGF0ZWQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYXJ0aWNpcGF0ZWRDdHJsJyxcbiAgICAgICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBQYXJ0aWNpcGF0ZWQgUGFnZSEnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnUGFydGljaXBhdGVkJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL3BhcnRpY2lwYXRlZC5odG1sJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdFeHBpcmVkSW50ZXJjZXB0b3InKTtcbn1dKTtcblxuLy9UaGUgdXJsIGZvciB0aGUgUkVTVCBBUElcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnYXBpX3VybCcsICckJEFwaVVybCQkJyk7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2NvbmZpZ19vYmplY3QnLCAkJENvbmZpZ09iamVjdCQkKTtcbi8vSW5qZWN0IHRoZSBuYW1lIG9mIHRoZSBhcHBsaWNhdGlvbiBpbnRvIG91ciBhcHBsaWNhdGlvbiBzbyB0aGF0IHdlIGNhbiB1c2UgaWl0XG4vL1doZW4gd2UgcmVuZGVyIHRoZSBwYWdlXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2FwcFRpdGxlJywgJyQkQXBwVGl0bGUkJCcpO1xuLy9EZWZpbmUgdGhlIGdlbmVyaWMgaGVhZGVyIGZvciB0aGUgY2FzZSBsaXN0IHZpZXdcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnZ2VuZXJpY0hlYWRlcnMnLCBbXG4gICAge3RpdGxlOiAnQ2FzZSAjJ30sXG4gICAge3RpdGxlOiAnUHJvY2Vzcyd9LFxuICAgIHt0aXRsZTogJ1Rhc2snfSxcbiAgICB7dGl0bGU6ICdTZW50IEJ5J30sXG4gICAge3RpdGxlOiAnRHVlIERhdGUnfSxcbiAgICB7dGl0bGU6ICdMYXN0IE1vZGlmaWVkJ30sXG4gICAge3RpdGxlOiAnUHJpb3JpdHknfVxuXSk7XG4vL0RlZmluZSB0aGUgYWN0aXZlIG1lbnUgaXRlbXMgZm9yIHRoZSBhcHBsaWNhdGlvblxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdhY3RpdmVNZW51SXRlbXMnLFxuICAgIHtcbiAgICAgICAgJ05ldyBQcm9jZXNzJyA6ICduZXdwcm9jZXNzU2VsZWN0ZWQnLFxuICAgICAgICAnSW5ib3gnOiAnaW5ib3hTZWxlY3RlZCcsXG4gICAgICAgICdEcmFmdCcgOiAnZHJhZnRTZWxlY3RlZCcsXG4gICAgICAgICdQYXJ0aWNpcGF0ZWQnIDogJ3BhcnRpY2lwYXRlZFNlbGVjdGVkJyxcbiAgICAgICAgJ1VuYXNzaWduZWQnIDogJ3VuYXNzaWduZWRTZWxlY3RlZCdcbiAgICB9XG4pOyIsIi8qIG9hdXRoLW5nIC0gdjAuNC4yIC0gMjAxNS0wNi0xOSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEFwcCBsaWJyYXJpZXNcbmFuZ3VsYXIubW9kdWxlKCdvYXV0aCcsIFtcbiAgJ29hdXRoLmRpcmVjdGl2ZScsICAgICAgLy8gbG9naW4gZGlyZWN0aXZlXG4gICdvYXV0aC5hY2Nlc3NUb2tlbicsICAgIC8vIGFjY2VzcyB0b2tlbiBzZXJ2aWNlXG4gICdvYXV0aC5lbmRwb2ludCcsICAgICAgIC8vIG9hdXRoIGVuZHBvaW50IHNlcnZpY2VcbiAgJ29hdXRoLnByb2ZpbGUnLCAgICAgICAgLy8gcHJvZmlsZSBtb2RlbFxuICAnb2F1dGguc3RvcmFnZScsICAgICAgICAvLyBzdG9yYWdlXG4gICdvYXV0aC5pbnRlcmNlcHRvcicgICAgIC8vIGJlYXJlciB0b2tlbiBpbnRlcmNlcHRvclxuXSlcbiAgLmNvbmZpZyhbJyRsb2NhdGlvblByb3ZpZGVyJywnJGh0dHBQcm92aWRlcicsXG4gIGZ1bmN0aW9uKCRsb2NhdGlvblByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpLmhhc2hQcmVmaXgoJyEnKTtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdFeHBpcmVkSW50ZXJjZXB0b3InKTtcbiAgfV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBhY2Nlc3NUb2tlblNlcnZpY2UgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGguYWNjZXNzVG9rZW4nLCBbXSk7XG5cbmFjY2Vzc1Rva2VuU2VydmljZS5mYWN0b3J5KCdBY2Nlc3NUb2tlbicsIFsnU3RvcmFnZScsICckcm9vdFNjb3BlJywgJyRsb2NhdGlvbicsICckaW50ZXJ2YWwnLCBmdW5jdGlvbihTdG9yYWdlLCAkcm9vdFNjb3BlLCAkbG9jYXRpb24sICRpbnRlcnZhbCl7XG5cbiAgdmFyIHNlcnZpY2UgPSB7XG4gICAgdG9rZW46IG51bGxcbiAgfSxcbiAgb0F1dGgySGFzaFRva2VucyA9IFsgLy9wZXIgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjc0OSNzZWN0aW9uLTQuMi4yXG4gICAgJ2FjY2Vzc190b2tlbicsICd0b2tlbl90eXBlJywgJ2V4cGlyZXNfaW4nLCAnc2NvcGUnLCAnc3RhdGUnLFxuICAgICdlcnJvcicsJ2Vycm9yX2Rlc2NyaXB0aW9uJ1xuICBdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhY2Nlc3MgdG9rZW4uXG4gICAqL1xuICBzZXJ2aWNlLmdldCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldHMgYW5kIHJldHVybnMgdGhlIGFjY2VzcyB0b2tlbi4gSXQgdHJpZXMgKGluIG9yZGVyKSB0aGUgZm9sbG93aW5nIHN0cmF0ZWdpZXM6XG4gICAqIC0gdGFrZXMgdGhlIHRva2VuIGZyb20gdGhlIGZyYWdtZW50IFVSSVxuICAgKiAtIHRha2VzIHRoZSB0b2tlbiBmcm9tIHRoZSBzZXNzaW9uU3RvcmFnZVxuICAgKi9cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuc2V0VG9rZW5Gcm9tU3RyaW5nKCRsb2NhdGlvbi5oYXNoKCkpO1xuXG4gICAgLy9JZiBoYXNoIGlzIHByZXNlbnQgaW4gVVJMIGFsd2F5cyB1c2UgaXQsIGN1eiBpdHMgY29taW5nIGZyb20gb0F1dGgyIHByb3ZpZGVyIHJlZGlyZWN0XG4gICAgaWYobnVsbCA9PT0gc2VydmljZS50b2tlbil7XG4gICAgICBzZXRUb2tlbkZyb21TZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgYWNjZXNzIHRva2VuIGFuZCByZW1vdmUgdGhlIHNlc3Npb24uXG4gICAqIEByZXR1cm5zIHtudWxsfVxuICAgKi9cbiAgc2VydmljZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgICBTdG9yYWdlLmRlbGV0ZSgndG9rZW4nKTtcbiAgICB0aGlzLnRva2VuID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcy50b2tlbjtcbiAgfTtcblxuICAvKipcbiAgICogVGVsbHMgaWYgdGhlIGFjY2VzcyB0b2tlbiBpcyBleHBpcmVkLlxuICAgKi9cbiAgc2VydmljZS5leHBpcmVkID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gKHRoaXMudG9rZW4gJiYgdGhpcy50b2tlbi5leHBpcmVzX2F0ICYmIG5ldyBEYXRlKHRoaXMudG9rZW4uZXhwaXJlc19hdCkgPCBuZXcgRGF0ZSgpKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IHRoZSBhY2Nlc3MgdG9rZW4gZnJvbSBhIHN0cmluZyBhbmQgc2F2ZSBpdFxuICAgKiBAcGFyYW0gaGFzaFxuICAgKi9cbiAgc2VydmljZS5zZXRUb2tlbkZyb21TdHJpbmcgPSBmdW5jdGlvbihoYXNoKXtcbiAgICB2YXIgcGFyYW1zID0gZ2V0VG9rZW5Gcm9tU3RyaW5nKGhhc2gpO1xuXG4gICAgaWYocGFyYW1zKXtcbiAgICAgIHJlbW92ZUZyYWdtZW50KCk7XG4gICAgICBzZXRUb2tlbihwYXJhbXMpO1xuICAgICAgc2V0RXhwaXJlc0F0KCk7XG4gICAgICAvLyBXZSBoYXZlIHRvIHNhdmUgaXQgYWdhaW4gdG8gbWFrZSBzdXJlIGV4cGlyZXNfYXQgaXMgc2V0XG4gICAgICAvLyAgYW5kIHRoZSBleHBpcnkgZXZlbnQgaXMgc2V0IHVwIHByb3Blcmx5XG4gICAgICBzZXRUb2tlbih0aGlzLnRva2VuKTtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6bG9naW4nLCBzZXJ2aWNlLnRva2VuKTtcbiAgICB9XG4gIH07XG5cbiAgLyogKiAqICogKiAqICogKiAqICpcbiAgICogUFJJVkFURSBNRVRIT0RTICpcbiAgICogKiAqICogKiAqICogKiAqICovXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYWNjZXNzIHRva2VuIGZyb20gdGhlIHNlc3Npb25TdG9yYWdlLlxuICAgKi9cbiAgdmFyIHNldFRva2VuRnJvbVNlc3Npb24gPSBmdW5jdGlvbigpe1xuICAgIHZhciBwYXJhbXMgPSBTdG9yYWdlLmdldCgndG9rZW4nKTtcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBzZXRUb2tlbihwYXJhbXMpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSBhY2Nlc3MgdG9rZW4uXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXNcbiAgICogQHJldHVybnMgeyp8e319XG4gICAqL1xuICB2YXIgc2V0VG9rZW4gPSBmdW5jdGlvbihwYXJhbXMpe1xuICAgIHNlcnZpY2UudG9rZW4gPSBzZXJ2aWNlLnRva2VuIHx8IHt9OyAgICAgIC8vIGluaXQgdGhlIHRva2VuXG4gICAgYW5ndWxhci5leHRlbmQoc2VydmljZS50b2tlbiwgcGFyYW1zKTsgICAgICAvLyBzZXQgdGhlIGFjY2VzcyB0b2tlbiBwYXJhbXNcbiAgICBzZXRUb2tlbkluU2Vzc2lvbigpOyAgICAgICAgICAgICAgICAvLyBzYXZlIHRoZSB0b2tlbiBpbnRvIHRoZSBzZXNzaW9uXG4gICAgc2V0RXhwaXJlc0F0RXZlbnQoKTsgICAgICAgICAgICAgICAgLy8gZXZlbnQgdG8gZmlyZSB3aGVuIHRoZSB0b2tlbiBleHBpcmVzXG5cbiAgICByZXR1cm4gc2VydmljZS50b2tlbjtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2UgdGhlIGZyYWdtZW50IFVSSSBhbmQgcmV0dXJuIGFuIG9iamVjdFxuICAgKiBAcGFyYW0gaGFzaFxuICAgKiBAcmV0dXJucyB7e319XG4gICAqL1xuICB2YXIgZ2V0VG9rZW5Gcm9tU3RyaW5nID0gZnVuY3Rpb24oaGFzaCl7XG4gICAgdmFyIHBhcmFtcyA9IHt9LFxuICAgICAgICByZWdleCA9IC8oW14mPV0rKT0oW14mXSopL2csXG4gICAgICAgIG07XG5cbiAgICB3aGlsZSAoKG0gPSByZWdleC5leGVjKGhhc2gpKSAhPT0gbnVsbCkge1xuICAgICAgcGFyYW1zW2RlY29kZVVSSUNvbXBvbmVudChtWzFdKV0gPSBkZWNvZGVVUklDb21wb25lbnQobVsyXSk7XG4gICAgfVxuXG4gICAgaWYocGFyYW1zLmFjY2Vzc190b2tlbiB8fCBwYXJhbXMuZXJyb3Ipe1xuICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhdmUgdGhlIGFjY2VzcyB0b2tlbiBpbnRvIHRoZSBzZXNzaW9uXG4gICAqL1xuICB2YXIgc2V0VG9rZW5JblNlc3Npb24gPSBmdW5jdGlvbigpe1xuICAgIFN0b3JhZ2Uuc2V0KCd0b2tlbicsIHNlcnZpY2UudG9rZW4pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFjY2VzcyB0b2tlbiBleHBpcmF0aW9uIGRhdGUgKHVzZWZ1bCBmb3IgcmVmcmVzaCBsb2dpY3MpXG4gICAqL1xuICB2YXIgc2V0RXhwaXJlc0F0ID0gZnVuY3Rpb24oKXtcbiAgICBpZiAoIXNlcnZpY2UudG9rZW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYodHlwZW9mKHNlcnZpY2UudG9rZW4uZXhwaXJlc19pbikgIT09ICd1bmRlZmluZWQnICYmIHNlcnZpY2UudG9rZW4uZXhwaXJlc19pbiAhPT0gbnVsbCkge1xuICAgICAgdmFyIGV4cGlyZXNfYXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgZXhwaXJlc19hdC5zZXRTZWNvbmRzKGV4cGlyZXNfYXQuZ2V0U2Vjb25kcygpICsgcGFyc2VJbnQoc2VydmljZS50b2tlbi5leHBpcmVzX2luKS02MCk7IC8vIDYwIHNlY29uZHMgbGVzcyB0byBzZWN1cmUgYnJvd3NlciBhbmQgcmVzcG9uc2UgbGF0ZW5jeVxuICAgICAgc2VydmljZS50b2tlbi5leHBpcmVzX2F0ID0gZXhwaXJlc19hdDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQgPSBudWxsO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHRpbWVvdXQgYXQgd2hpY2ggdGhlIGV4cGlyZWQgZXZlbnQgaXMgZmlyZWRcbiAgICovXG4gIHZhciBzZXRFeHBpcmVzQXRFdmVudCA9IGZ1bmN0aW9uKCl7XG4gICAgLy8gRG9uJ3QgYm90aGVyIGlmIHRoZXJlJ3Mgbm8gZXhwaXJlcyB0b2tlblxuICAgIGlmICh0eXBlb2Yoc2VydmljZS50b2tlbi5leHBpcmVzX2F0KSA9PT0gJ3VuZGVmaW5lZCcgfHwgc2VydmljZS50b2tlbi5leHBpcmVzX2F0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lID0gKG5ldyBEYXRlKHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCkpLShuZXcgRGF0ZSgpKTtcbiAgICBpZih0aW1lKXtcbiAgICAgICRpbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmV4cGlyZWQnLCBzZXJ2aWNlLnRva2VuKTtcbiAgICAgIH0sIHRpbWUsIDEpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBvQXV0aDIgcGllY2VzIGZyb20gdGhlIGhhc2ggZnJhZ21lbnRcbiAgICovXG4gIHZhciByZW1vdmVGcmFnbWVudCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGN1ckhhc2ggPSAkbG9jYXRpb24uaGFzaCgpO1xuICAgIGFuZ3VsYXIuZm9yRWFjaChvQXV0aDJIYXNoVG9rZW5zLGZ1bmN0aW9uKGhhc2hLZXkpe1xuICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnJicraGFzaEtleSsnKD1bXiZdKik/fF4nK2hhc2hLZXkrJyg9W14mXSopPyY/Jyk7XG4gICAgICBjdXJIYXNoID0gY3VySGFzaC5yZXBsYWNlKHJlLCcnKTtcbiAgICB9KTtcblxuICAgICRsb2NhdGlvbi5oYXNoKGN1ckhhc2gpO1xuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xuXG59XSk7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVuZHBvaW50Q2xpZW50ID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmVuZHBvaW50JywgW10pO1xuXG5lbmRwb2ludENsaWVudC5mYWN0b3J5KCdFbmRwb2ludCcsIGZ1bmN0aW9uKCkge1xuXG4gIHZhciBzZXJ2aWNlID0ge307XG5cbiAgLypcbiAgICogRGVmaW5lcyB0aGUgYXV0aG9yaXphdGlvbiBVUkxcbiAgICovXG5cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbihjb25maWd1cmF0aW9uKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWd1cmF0aW9uO1xuICAgIHJldHVybiB0aGlzLmdldCgpO1xuICB9O1xuXG4gIC8qXG4gICAqIFJldHVybnMgdGhlIGF1dGhvcml6YXRpb24gVVJMXG4gICAqL1xuXG4gIHNlcnZpY2UuZ2V0ID0gZnVuY3Rpb24oIG92ZXJyaWRlcyApIHtcbiAgICB2YXIgcGFyYW1zID0gYW5ndWxhci5leHRlbmQoIHt9LCBzZXJ2aWNlLmNvbmZpZywgb3ZlcnJpZGVzKTtcbiAgICB2YXIgb0F1dGhTY29wZSA9IChwYXJhbXMuc2NvcGUpID8gZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5zY29wZSkgOiAnJyxcbiAgICAgICAgc3RhdGUgPSAocGFyYW1zLnN0YXRlKSA/IGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMuc3RhdGUpIDogJycsXG4gICAgICAgIGF1dGhQYXRoSGFzUXVlcnkgPSAocGFyYW1zLmF1dGhvcml6ZVBhdGguaW5kZXhPZignPycpID09PSAtMSkgPyBmYWxzZSA6IHRydWUsXG4gICAgICAgIGFwcGVuZENoYXIgPSAoYXV0aFBhdGhIYXNRdWVyeSkgPyAnJicgOiAnPycsICAgIC8vaWYgYXV0aG9yaXplUGF0aCBoYXMgPyBhbHJlYWR5IGFwcGVuZCBPQXV0aDIgcGFyYW1zXG4gICAgICAgIHJlc3BvbnNlVHlwZSA9IChwYXJhbXMucmVzcG9uc2VUeXBlKSA/IGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMucmVzcG9uc2VUeXBlKSA6ICcnO1xuXG4gICAgdmFyIHVybCA9IHBhcmFtcy5zaXRlICtcbiAgICAgICAgICBwYXJhbXMuYXV0aG9yaXplUGF0aCArXG4gICAgICAgICAgYXBwZW5kQ2hhciArICdyZXNwb25zZV90eXBlPScgKyByZXNwb25zZVR5cGUgKyAnJicgK1xuICAgICAgICAgICdjbGllbnRfaWQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMuY2xpZW50SWQpICsgJyYnICtcbiAgICAgICAgICAncmVkaXJlY3RfdXJpPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnJlZGlyZWN0VXJpKSArICcmJyArXG4gICAgICAgICAgJ3Njb3BlPScgKyBvQXV0aFNjb3BlICsgJyYnICtcbiAgICAgICAgICAnc3RhdGU9JyArIHN0YXRlO1xuXG4gICAgaWYoIHBhcmFtcy5ub25jZSApIHtcbiAgICAgIHVybCA9IHVybCArICcmbm9uY2U9JyArIHBhcmFtcy5ub25jZTtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbiAgfTtcblxuICAvKlxuICAgKiBSZWRpcmVjdHMgdGhlIGFwcCB0byB0aGUgYXV0aG9yaXphdGlvbiBVUkxcbiAgICovXG5cbiAgc2VydmljZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKCBvdmVycmlkZXMgKSB7XG4gICAgdmFyIHRhcmdldExvY2F0aW9uID0gdGhpcy5nZXQoIG92ZXJyaWRlcyApO1xuICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHRhcmdldExvY2F0aW9uKTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcbn0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwcm9maWxlQ2xpZW50ID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLnByb2ZpbGUnLCBbXSk7XG5cbnByb2ZpbGVDbGllbnQuZmFjdG9yeSgnUHJvZmlsZScsIFsnJGh0dHAnLCAnQWNjZXNzVG9rZW4nLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCBBY2Nlc3NUb2tlbiwgJHJvb3RTY29wZSkge1xuICB2YXIgc2VydmljZSA9IHt9O1xuICB2YXIgcHJvZmlsZTtcblxuICBzZXJ2aWNlLmZpbmQgPSBmdW5jdGlvbih1cmkpIHtcbiAgICB2YXIgcHJvbWlzZSA9ICRodHRwLmdldCh1cmksIHsgaGVhZGVyczogaGVhZGVycygpIH0pO1xuICAgIHByb21pc2Uuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICBwcm9maWxlID0gcmVzcG9uc2U7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6cHJvZmlsZScsIHByb2ZpbGUpO1xuICAgICAgfSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH07XG5cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcHJvZmlsZTtcbiAgfTtcblxuICBzZXJ2aWNlLnNldCA9IGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgcHJvZmlsZSA9IHJlc291cmNlO1xuICAgIHJldHVybiBwcm9maWxlO1xuICB9O1xuXG4gIHZhciBoZWFkZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHsgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgQWNjZXNzVG9rZW4uZ2V0KCkuYWNjZXNzX3Rva2VuIH07XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0b3JhZ2VTZXJ2aWNlID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLnN0b3JhZ2UnLCBbJ25nU3RvcmFnZSddKTtcblxuc3RvcmFnZVNlcnZpY2UuZmFjdG9yeSgnU3RvcmFnZScsIFsnJHJvb3RTY29wZScsICckc2Vzc2lvblN0b3JhZ2UnLCAnJGxvY2FsU3RvcmFnZScsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzZXNzaW9uU3RvcmFnZSwgJGxvY2FsU3RvcmFnZSl7XG5cbiAgdmFyIHNlcnZpY2UgPSB7XG4gICAgc3RvcmFnZTogJHNlc3Npb25TdG9yYWdlIC8vIEJ5IGRlZmF1bHRcbiAgfTtcblxuICAvKipcbiAgICogRGVsZXRlcyB0aGUgaXRlbSBmcm9tIHN0b3JhZ2UsXG4gICAqIFJldHVybnMgdGhlIGl0ZW0ncyBwcmV2aW91cyB2YWx1ZVxuICAgKi9cbiAgc2VydmljZS5kZWxldGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBzdG9yZWQgPSB0aGlzLmdldChuYW1lKTtcbiAgICBkZWxldGUgdGhpcy5zdG9yYWdlW25hbWVdO1xuICAgIHJldHVybiBzdG9yZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGl0ZW0gZnJvbSBzdG9yYWdlXG4gICAqL1xuICBzZXJ2aWNlLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcmFnZVtuYW1lXTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgaXRlbSBpbiBzdG9yYWdlIHRvIHRoZSB2YWx1ZSBzcGVjaWZpZWRcbiAgICogUmV0dXJucyB0aGUgaXRlbSdzIHZhbHVlXG4gICAqL1xuICBzZXJ2aWNlLnNldCA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMuc3RvcmFnZVtuYW1lXSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzLmdldChuYW1lKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBzdG9yYWdlIHNlcnZpY2UgYmVpbmcgdXNlZFxuICAgKi9cbiAgc2VydmljZS51c2UgPSBmdW5jdGlvbiAoc3RvcmFnZSkge1xuICAgIGlmIChzdG9yYWdlID09PSAnc2Vzc2lvblN0b3JhZ2UnKSB7XG4gICAgICB0aGlzLnN0b3JhZ2UgPSAkc2Vzc2lvblN0b3JhZ2U7XG4gICAgfSBlbHNlIGlmIChzdG9yYWdlID09PSAnbG9jYWxTdG9yYWdlJykge1xuICAgICAgdGhpcy5zdG9yYWdlID0gJGxvY2FsU3RvcmFnZTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG59XSk7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbnRlcmNlcHRvclNlcnZpY2UgPSBhbmd1bGFyLm1vZHVsZSgnb2F1dGguaW50ZXJjZXB0b3InLCBbXSk7XG5cbmludGVyY2VwdG9yU2VydmljZS5mYWN0b3J5KCdFeHBpcmVkSW50ZXJjZXB0b3InLCBbJ1N0b3JhZ2UnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uIChTdG9yYWdlLCAkcm9vdFNjb3BlKSB7XG5cbiAgdmFyIHNlcnZpY2UgPSB7fTtcblxuICBzZXJ2aWNlLnJlcXVlc3QgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICB2YXIgdG9rZW4gPSBTdG9yYWdlLmdldCgndG9rZW4nKTtcblxuICAgIGlmICh0b2tlbiAmJiBleHBpcmVkKHRva2VuKSkge1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpleHBpcmVkJywgdG9rZW4pO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWc7XG4gIH07XG5cbiAgdmFyIGV4cGlyZWQgPSBmdW5jdGlvbih0b2tlbikge1xuICAgIHJldHVybiAodG9rZW4gJiYgdG9rZW4uZXhwaXJlc19hdCAmJiBuZXcgRGF0ZSh0b2tlbi5leHBpcmVzX2F0KSA8IG5ldyBEYXRlKCkpO1xuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkaXJlY3RpdmVzID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmRpcmVjdGl2ZScsIFtdKTtcblxuZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ29hdXRoJywgW1xuICAnQWNjZXNzVG9rZW4nLFxuICAnRW5kcG9pbnQnLFxuICAnUHJvZmlsZScsXG4gICdTdG9yYWdlJyxcbiAgJyRsb2NhdGlvbicsXG4gICckcm9vdFNjb3BlJyxcbiAgJyRjb21waWxlJyxcbiAgJyRodHRwJyxcbiAgJyR0ZW1wbGF0ZUNhY2hlJyxcbiAgJ2NvbmZpZ19vYmplY3QnLFxuICBmdW5jdGlvbihBY2Nlc3NUb2tlbiwgRW5kcG9pbnQsIFByb2ZpbGUsIFN0b3JhZ2UsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgJGNvbXBpbGUsICRodHRwLCAkdGVtcGxhdGVDYWNoZSwgY29uZmlnX29iamVjdCkge1xuXG4gICAgdmFyIGRlZmluaXRpb24gPSB7XG4gICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICBzY29wZToge1xuICAgICAgICBzaXRlOiAnQCcsICAgICAgICAgIC8vIChyZXF1aXJlZCkgc2V0IHRoZSBvYXV0aCBzZXJ2ZXIgaG9zdCAoZS5nLiBodHRwOi8vb2F1dGguZXhhbXBsZS5jb20pXG4gICAgICAgIGNsaWVudElkOiAnQCcsICAgICAgLy8gKHJlcXVpcmVkKSBjbGllbnQgaWRcbiAgICAgICAgcmVkaXJlY3RVcmk6ICdAJywgICAvLyAocmVxdWlyZWQpIGNsaWVudCByZWRpcmVjdCB1cmlcbiAgICAgICAgcmVzcG9uc2VUeXBlOiAnQCcsICAvLyAob3B0aW9uYWwpIHJlc3BvbnNlIHR5cGUsIGRlZmF1bHRzIHRvIHRva2VuICh1c2UgJ3Rva2VuJyBmb3IgaW1wbGljaXQgZmxvdyBhbmQgJ2NvZGUnIGZvciBhdXRob3JpemF0aW9uIGNvZGUgZmxvd1xuICAgICAgICBzY29wZTogJ0AnLCAgICAgICAgIC8vIChvcHRpb25hbCkgc2NvcGVcbiAgICAgICAgcHJvZmlsZVVyaTogJ0AnLCAgICAvLyAob3B0aW9uYWwpIHVzZXIgcHJvZmlsZSB1cmkgKGUuZyBodHRwOi8vZXhhbXBsZS5jb20vbWUpXG4gICAgICAgIHRlbXBsYXRlOiAnQCcsICAgICAgLy8gKG9wdGlvbmFsKSB0ZW1wbGF0ZSB0byByZW5kZXIgKGUuZyBib3dlcl9jb21wb25lbnRzL29hdXRoLW5nL2Rpc3Qvdmlld3MvdGVtcGxhdGVzL2RlZmF1bHQuaHRtbClcbiAgICAgICAgdGV4dDogJ0AnLCAgICAgICAgICAvLyAob3B0aW9uYWwpIGxvZ2luIHRleHRcbiAgICAgICAgYXV0aG9yaXplUGF0aDogJ0AnLCAvLyAob3B0aW9uYWwpIGF1dGhvcml6YXRpb24gdXJsXG4gICAgICAgIHN0YXRlOiAnQCcsICAgICAgICAgLy8gKG9wdGlvbmFsKSBBbiBhcmJpdHJhcnkgdW5pcXVlIHN0cmluZyBjcmVhdGVkIGJ5IHlvdXIgYXBwIHRvIGd1YXJkIGFnYWluc3QgQ3Jvc3Mtc2l0ZSBSZXF1ZXN0IEZvcmdlcnlcbiAgICAgICAgc3RvcmFnZTogJ0AnICAgICAgICAvLyAob3B0aW9uYWwpIFN0b3JlIHRva2VuIGluICdzZXNzaW9uU3RvcmFnZScgb3IgJ2xvY2FsU3RvcmFnZScsIGRlZmF1bHRzIHRvICdzZXNzaW9uU3RvcmFnZSdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZGVmaW5pdGlvbi5saW5rID0gZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgIHNjb3BlLnNob3cgPSAnbm9uZSc7XG5cbiAgICAgIHNjb3BlLiR3YXRjaCgnY2xpZW50SWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaW5pdCgpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBpbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGluaXRBdHRyaWJ1dGVzKCk7ICAgICAgICAgIC8vIHNldHMgZGVmYXVsdHNcbiAgICAgICAgU3RvcmFnZS51c2Uoc2NvcGUuc3RvcmFnZSk7Ly8gc2V0IHN0b3JhZ2VcbiAgICAgICAgY29tcGlsZSgpOyAgICAgICAgICAgICAgICAgLy8gY29tcGlsZXMgdGhlIGRlc2lyZWQgbGF5b3V0XG4gICAgICAgIEVuZHBvaW50LnNldChzY29wZSk7ICAgICAgIC8vIHNldHMgdGhlIG9hdXRoIGF1dGhvcml6YXRpb24gdXJsXG4gICAgICAgIEFjY2Vzc1Rva2VuLnNldChzY29wZSk7ICAgIC8vIHNldHMgdGhlIGFjY2VzcyB0b2tlbiBvYmplY3QgKGlmIGV4aXN0aW5nLCBmcm9tIGZyYWdtZW50IG9yIHNlc3Npb24pXG4gICAgICAgIGluaXRQcm9maWxlKHNjb3BlKTsgICAgICAgIC8vIGdldHMgdGhlIHByb2ZpbGUgcmVzb3VyY2UgKGlmIGV4aXN0aW5nIHRoZSBhY2Nlc3MgdG9rZW4pXG4gICAgICAgIGluaXRWaWV3KCk7ICAgICAgICAgICAgICAgIC8vIHNldHMgdGhlIHZpZXcgKGxvZ2dlZCBpbiBvciBvdXQpXG4gICAgICB9O1xuXG4gICAgICB2YXIgaW5pdEF0dHJpYnV0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2NvcGUuYXV0aG9yaXplUGF0aCA9IHNjb3BlLmF1dGhvcml6ZVBhdGggfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24uYXV0aG9yaXplUGF0aDtcbiAgICAgICAgc2NvcGUudG9rZW5QYXRoICAgICA9IHNjb3BlLnRva2VuUGF0aCAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24udG9rZW5QYXRoO1xuICAgICAgICBzY29wZS50ZW1wbGF0ZSAgICAgID0gc2NvcGUudGVtcGxhdGUgICAgICB8fCAndmlld3MvdGVtcGxhdGVzL2J1dHRvbi5odG1sJztcbiAgICAgICAgc2NvcGUucmVzcG9uc2VUeXBlICA9IHNjb3BlLnJlc3BvbnNlVHlwZSAgfHwgJ3Rva2VuJztcbiAgICAgICAgc2NvcGUudGV4dCAgICAgICAgICA9IHNjb3BlLnRleHQgICAgICAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24udGV4dDtcbiAgICAgICAgc2NvcGUuc3RhdGUgICAgICAgICA9IHNjb3BlLnN0YXRlICAgICAgICAgfHwgdW5kZWZpbmVkO1xuICAgICAgICBzY29wZS5zY29wZSAgICAgICAgID0gc2NvcGUuc2NvcGUgICAgICAgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5zY29wZTtcbiAgICAgICAgc2NvcGUuc3RvcmFnZSAgICAgICA9IHNjb3BlLnN0b3JhZ2UgICAgICAgfHwgJ3Nlc3Npb25TdG9yYWdlJztcbiAgICAgICAgc2NvcGUuc2l0ZSAgICAgICAgICA9IHNjb3BlLnNpdGUgICAgICAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24uc2l0ZTtcbiAgICAgICAgc2NvcGUuY2xpZW50SWQgICAgICA9IHNjb3BlLmNsaWVudElkICAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24uY2xpZW50SWQ7XG4gICAgICAgIHNjb3BlLnJlZGlyZWN0VXJpICAgPSBzY29wZS5yZWRpcmVjdFVyaSAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnJlZGlyZWN0VXJpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJGh0dHAuZ2V0KHNjb3BlLnRlbXBsYXRlLCB7IGNhY2hlOiAkdGVtcGxhdGVDYWNoZSB9KS5zdWNjZXNzKGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgICBlbGVtZW50Lmh0bWwoaHRtbCk7XG4gICAgICAgICAgJGNvbXBpbGUoZWxlbWVudC5jb250ZW50cygpKShzY29wZSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIGluaXRQcm9maWxlID0gZnVuY3Rpb24oc2NvcGUpIHtcbiAgICAgICAgdmFyIHRva2VuID0gQWNjZXNzVG9rZW4uZ2V0KCk7XG5cbiAgICAgICAgaWYgKHRva2VuICYmIHRva2VuLmFjY2Vzc190b2tlbiAmJiBzY29wZS5wcm9maWxlVXJpKSB7XG4gICAgICAgICAgUHJvZmlsZS5maW5kKHNjb3BlLnByb2ZpbGVVcmkpLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHNjb3BlLnByb2ZpbGUgPSByZXNwb25zZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGluaXRWaWV3ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IEFjY2Vzc1Rva2VuLmdldCgpO1xuXG4gICAgICAgIGlmICghdG9rZW4pIHtcbiAgICAgICAgICByZXR1cm4gbG9nZ2VkT3V0KCk7IC8vIHdpdGhvdXQgYWNjZXNzIHRva2VuIGl0J3MgbG9nZ2VkIG91dFxuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbi5hY2Nlc3NfdG9rZW4pIHtcbiAgICAgICAgICByZXR1cm4gYXV0aG9yaXplZCgpOyAvLyBpZiB0aGVyZSBpcyB0aGUgYWNjZXNzIHRva2VuIHdlIGFyZSBkb25lXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuLmVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIGRlbmllZCgpOyAvLyBpZiB0aGUgcmVxdWVzdCBoYXMgYmVlbiBkZW5pZWQgd2UgZmlyZSB0aGUgZGVuaWVkIGV2ZW50XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEVuZHBvaW50LnJlZGlyZWN0KCk7XG4gICAgICB9O1xuXG4gICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgQWNjZXNzVG9rZW4uZGVzdHJveShzY29wZSk7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6bG9nb3V0Jyk7XG4gICAgICAgIGxvZ2dlZE91dCgpO1xuICAgICAgfTtcblxuICAgICAgc2NvcGUuJG9uKCdvYXV0aDpleHBpcmVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koc2NvcGUpO1xuICAgICAgICBzY29wZS5zaG93ID0gJ2xvZ2dlZC1vdXQnO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIHVzZXIgaXMgYXV0aG9yaXplZFxuICAgICAgdmFyIGF1dGhvcml6ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDphdXRob3JpemVkJywgQWNjZXNzVG9rZW4uZ2V0KCkpO1xuICAgICAgICBzY29wZS5zaG93ID0gJ2xvZ2dlZC1pbic7XG4gICAgICB9O1xuXG4gICAgICAvLyBzZXQgdGhlIG9hdXRoIGRpcmVjdGl2ZSB0byB0aGUgbG9nZ2VkLW91dCBzdGF0dXNcbiAgICAgIHZhciBsb2dnZWRPdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpsb2dnZWRPdXQnKTtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdsb2dnZWQtb3V0JztcbiAgICAgIH07XG5cbiAgICAgIC8vIHNldCB0aGUgb2F1dGggZGlyZWN0aXZlIHRvIHRoZSBkZW5pZWQgc3RhdHVzXG4gICAgICB2YXIgZGVuaWVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNjb3BlLnNob3cgPSAnZGVuaWVkJztcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpkZW5pZWQnKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFVwZGF0ZXMgdGhlIHRlbXBsYXRlIGF0IHJ1bnRpbWVcbiAgICAgIHNjb3BlLiRvbignb2F1dGg6dGVtcGxhdGU6dXBkYXRlJywgZnVuY3Rpb24oZXZlbnQsIHRlbXBsYXRlKSB7XG4gICAgICAgIHNjb3BlLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIGNvbXBpbGUoc2NvcGUpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEhhY2sgdG8gdXBkYXRlIHRoZSBkaXJlY3RpdmUgY29udGVudCBvbiBsb2dvdXRcbiAgICAgIC8vIFRPRE8gdGhpbmsgdG8gYSBjbGVhbmVyIHNvbHV0aW9uXG4gICAgICBzY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGluaXQoKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmaW5pdGlvbjtcbiAgfVxuXSk7XG4iLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8zMS8xNFxuICogQG5hbWUgQVBJXG4gKiBAZGVzYyBBUEkgU2VydmljZSBmb3IgY29ubmVjdGluZyB0byB0aGUgUHJvY2Vzc01ha2VyIDMuMCBSRVNUIEFQSVxuICovXG4ndXNlIHN0cmljdCc7XG4vL1NlcnZpY2UgdG8gbWFrZSBBUEkgY2FsbHMgdG8gdGhlIFJFU1QgQVBJXG4vL1dlIGFyZSBwYXNzaW5nICRodHRwIHRvIG1ha2UgYWpheCByZXF1ZXN0cyBhbmQgdGhlIHVybCBmb3IgdGhlIFJFU1QgQVBJXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykuXG5zZXJ2aWNlKCdBUEknLCBmdW5jdGlvbigkaHR0cCwgYXBpX3VybCl7XG4gICAgLy9XZSBhcmUgZGVmaW5pbmcgdGhlIHJlcXVlc3RUeXBlLCB0aGlzIGlzIHRoZSBzcGVjaWZpYyBlbmRwb2ludCBvZiB0aGUgUkVTVCBBUEkgd2UgYXJlIHJlcXVlc3RpbmdcbiAgICAvL1BhcmFtcyBhcmUgYW55IHBhcmFtZXRlcnMgdGhhdCB3ZSBhcmUgcGFzc2luZyBhcyBwYXJ0IG9mIGEgcG9zdC9wdXQgcmVxdWVzdFxuICAgIHZhciByZXF1ZXN0VHlwZSwgcGFyYW1zO1xuICAgIC8vRGVmaW5lIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBzZXJ2aWNlXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBnZXRSZXF1ZXN0VHlwZVxuICAgICAgICAgKiBAZGVzYyBHZXQgbWV0aG9kIGZvciBnZXR0aW5nIHRoZSBjdXJyZW50IHJlcXVlc3QgdHlwZVxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG4gICAgICAgIGdldFJlcXVlc3RUeXBlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFR5cGU7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgc2V0UmVxdWVzdFR5cGVcbiAgICAgICAgICogQGRlc2MgU2V0IG1ldGhvZCBmb3Igc2V0dGluZyB0aGUgY3VycmVudCByZXF1ZXN0IHR5cGVcbiAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAqL1xuICAgICAgICBzZXRSZXF1ZXN0VHlwZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUeXBlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgZ2V0UGFyYW1zXG4gICAgICAgICAqIEBkZXNjIEdldCBtZXRob2QgZm9yIGdldHRpbmcgdGhlIGN1cnJlbnQgcGFyYW1zXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0UGFyYW1zOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIHNldFBhcmFtc1xuICAgICAgICAgKiBAZGVzYyBTZXQgbWV0aG9kIGZvciBzZXR0aW5nIHRoZSBjdXJyZW50IHBhcmFtc1xuICAgICAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgICAgICovXG4gICAgICAgIHNldFBhcmFtczogZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICAgICAgcGFyYW1zID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbmFtZSBzZXRQYXJhbXNcbiAgICAgICAgICogQGRlc2MgVGhpcyBpcyB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgc2VydmljZS4gSXQgbWFrZXMgYSBjYWxsIHRvIHRoZSBSRVNUIEFQSVxuICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2sgLSByZXF1aXJlZFxuICAgICAgICAgKiBAcGFyYW0gcmVxdWVzdFR5cGUgLSBvcHRpb25hbFxuICAgICAgICAgKiBAcGFyYW0gbWV0aG9kIC0gb3B0aW9uYWxcbiAgICAgICAgICovXG4gICAgICAgIGNhbGw6IGZ1bmN0aW9uKGNhbGxiYWNrLCBtZXRob2QsIHJlcXVlc3RUeXBlKXtcblxuICAgICAgICAgICAgLy9EZWZpbmUgb3B0aW9uYWwgcGFyYW1zIHNvIHRoYXQgb25seSBjYWxsYmFjayBuZWVkcyB0byBiZSBzcGVjaWZpZWQgd2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICAgICAgICAgICAgLy9Bc3NpZ24gZGVmYXVsdCB2YWx1ZSBvZyBHRVQgdG8gdGhlIG1ldGhvZCB0aGF0IHdlIGFyZSByZXF1ZXN0aW5nXG5cbiAgICAgICAgICAgIGlmKCB0eXBlb2YgKCBtZXRob2QgKSA9PT0gJ3VuZGVmaW5lZCcpIG1ldGhvZCA9ICdHRVQnO1xuXG4gICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZGVmYXVsdCB2YWx1ZSBvZiB0aGUgcmVxdWVzdCB0eXBlIHRvIHRoZSBnZXR0ZXIgbWV0aG9kLlxuICAgICAgICAgICAgLy9UaGlzIGlzIHRoZSB3YXkgdG8gdXNlIHRoZSBzZXJ2aWNlLiBTZXQgdGhlIHNldFJlcXVlc3RUeXBlIHRvIHRoZSB1cmwgZW5kcG9pbnQgeW91IHdhbnQgdG8gaGl0XG4gICAgICAgICAgICAvL0ZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCBhIGxpc3Qgb2YgcHJvamVjdHMvcHJvY2VzcywgaW4geW91ciBjb250cm9sbGVyIGRvIHRoaXMgYmVmb3JlIHlvdSBjYWxsIHRoaXMgbWV0aG9kOlxuICAgICAgICAgICAgLy9BUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3RzJyk7XG5cbiAgICAgICAgICAgIGlmKCB0eXBlb2YgKCByZXF1ZXN0VHlwZSApID09PSAndW5kZWZpbmVkJykgcmVxdWVzdFR5cGUgPSB0aGlzLmdldFJlcXVlc3RUeXBlKCk7XG5cbiAgICAgICAgICAgIC8vSGFuZGxlIGlmIHRoZXJlIHdhcyBubyByZXF1ZXN0IHR5cGUgZGVmaW5lZFxuXG4gICAgICAgICAgICBpZiggdHlwZW9mICggcmVxdWVzdFR5cGUgKSA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnSW52YWxpZCByZXF1ZXN0VHlwZSBvciBubyByZXF1ZXN0VHlwZSBkZWZpbmVkLic7XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgU3dpdGNoIGJhc2VkIG9uIG1ldGhvZCB0eXBlIGluIG9yZGVyIHRvIHJlcXVlc3QgdGhlIHJpZ2h0IHR5cGUgb2YgYXBpXG4gICAgICAgICAgICAgRGVmYXVsdCBpcyB0aGUgR0VUIG1ldGhvZCwgYmVjYXVzZSB0aGlzIGlzIHRoZSBtb3N0IGNvbW1vbiBtZXRob2QgdXNlZFxuICAgICAgICAgICAgIENvbnZlcnQgdGhlIG1ldGhvZCB0byB1cHBlciBjYXNlIGZvciBjb25zaXN0ZW5jeVxuXG4gICAgICAgICAgICAgRmlyc3QsIHdlIG1ha2UgdGhlIGFwcHJvcHJpYXRlIGFqYXggY2FsbCB3aXRoIHRoZSByZWxldmFudCBlbmQgcG9pbnQgYXR0YWNoZWQgdG8gaXRcbiAgICAgICAgICAgICBUaGVuLCB3ZSBjaGVjayBpZiBhIGNhbGxiYWNrIGlzIGRlZmluZWQsIGlmIHNvLCB3ZSBydW4gaXQgd2hpbGUgcGFzc2luZyB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgICBmcm9tIHRoZSBzZXJ2ZXIgdG8gaXQuXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgc3dpdGNoKG1ldGhvZC50b1VwcGVyQ2FzZSgpKXtcbiAgICAgICAgICAgICAgICBjYXNlICdHRVQnOlxuICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoYXBpX3VybCtyZXF1ZXN0VHlwZSkuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjaykgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1BPU1QnOlxuICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KGFwaV91cmwrcmVxdWVzdFR5cGUsIHBhcmFtcykuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjaykgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1BVVCc6XG4gICAgICAgICAgICAgICAgICAgICRodHRwLnB1dChhcGlfdXJsK3JlcXVlc3RUeXBlLCBwYXJhbXMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBvciBubyBtZXRob2QgZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMzEvMTRcbiAqIEBuYW1lIG5nc3RvcmFnZVxuICogQGRlc2NcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLypqc2hpbnQgLVcwMzAgKi9cblxuKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG92ZXJ2aWV3XG4gICAgICogQG5hbWUgbmdTdG9yYWdlXG4gICAgICovXG5cbiAgICBhbmd1bGFyLm1vZHVsZSgnbmdTdG9yYWdlJywgW10pLlxuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG9iamVjdFxuICAgICAqIEBuYW1lIG5nU3RvcmFnZS4kbG9jYWxTdG9yYWdlXG4gICAgICogQHJlcXVpcmVzICRyb290U2NvcGVcbiAgICAgKiBAcmVxdWlyZXMgJHdpbmRvd1xuICAgICAqL1xuXG4gICAgICAgIGZhY3RvcnkoJyRsb2NhbFN0b3JhZ2UnLCBfc3RvcmFnZUZhY3RvcnkoJ2xvY2FsU3RvcmFnZScpKS5cblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBvYmplY3RcbiAgICAgKiBAbmFtZSBuZ1N0b3JhZ2UuJHNlc3Npb25TdG9yYWdlXG4gICAgICogQHJlcXVpcmVzICRyb290U2NvcGVcbiAgICAgKiBAcmVxdWlyZXMgJHdpbmRvd1xuICAgICAqL1xuXG4gICAgICAgIGZhY3RvcnkoJyRzZXNzaW9uU3RvcmFnZScsIF9zdG9yYWdlRmFjdG9yeSgnc2Vzc2lvblN0b3JhZ2UnKSk7XG5cbiAgICBmdW5jdGlvbiBfc3RvcmFnZUZhY3Rvcnkoc3RvcmFnZVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICckcm9vdFNjb3BlJyxcbiAgICAgICAgICAgICckd2luZG93JyxcblxuICAgICAgICAgICAgZnVuY3Rpb24oXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZSxcbiAgICAgICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAvLyAjOTogQXNzaWduIGEgcGxhY2Vob2xkZXIgb2JqZWN0IGlmIFdlYiBTdG9yYWdlIGlzIHVuYXZhaWxhYmxlIHRvIHByZXZlbnQgYnJlYWtpbmcgdGhlIGVudGlyZSBBbmd1bGFySlMgYXBwXG4gICAgICAgICAgICAgICAgdmFyIHdlYlN0b3JhZ2UgPSAkd2luZG93W3N0b3JhZ2VUeXBlXSB8fCAoY29uc29sZS53YXJuKCdUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBXZWIgU3RvcmFnZSEnKSwge30pLFxuICAgICAgICAgICAgICAgICAgICAkc3RvcmFnZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkZWZhdWx0OiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5pc0RlZmluZWQoJHN0b3JhZ2Vba10pIHx8ICgkc3RvcmFnZVtrXSA9IGl0ZW1zW2tdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgJHJlc2V0OiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gJHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyQnID09PSBrWzBdIHx8IGRlbGV0ZSAkc3RvcmFnZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2UuJGRlZmF1bHQoaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlLFxuICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2U7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgazsgaSA8IHdlYlN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gIzgsICMxMDogYHdlYlN0b3JhZ2Uua2V5KGkpYCBtYXkgYmUgYW4gZW1wdHkgc3RyaW5nIChvciB0aHJvdyBhbiBleGNlcHRpb24gaW4gSUU5IGlmIGB3ZWJTdG9yYWdlYCBpcyBlbXB0eSlcbiAgICAgICAgICAgICAgICAgICAgKGsgPSB3ZWJTdG9yYWdlLmtleShpKSkgJiYgJ25nU3RvcmFnZS0nID09PSBrLnNsaWNlKDAsIDEwKSAmJiAoJHN0b3JhZ2Vbay5zbGljZSgxMCldID0gYW5ndWxhci5mcm9tSnNvbih3ZWJTdG9yYWdlLmdldEl0ZW0oaykpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlID0gYW5ndWxhci5jb3B5KCRzdG9yYWdlKTtcblxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2UgfHwgKF9kZWJvdW5jZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZGVib3VuY2UgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKCRzdG9yYWdlLCBfbGFzdCRzdG9yYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkc3RvcmFnZSwgZnVuY3Rpb24odiwgaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmlzRGVmaW5lZCh2KSAmJiAnJCcgIT09IGtbMF0gJiYgd2ViU3RvcmFnZS5zZXRJdGVtKCduZ1N0b3JhZ2UtJyArIGssIGFuZ3VsYXIudG9Kc29uKHYpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgX2xhc3Qkc3RvcmFnZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gX2xhc3Qkc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJTdG9yYWdlLnJlbW92ZUl0ZW0oJ25nU3RvcmFnZS0nICsgayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2xhc3Qkc3RvcmFnZSA9IGFuZ3VsYXIuY29weSgkc3RvcmFnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gIzY6IFVzZSBgJHdpbmRvdy5hZGRFdmVudExpc3RlbmVyYCBpbnN0ZWFkIG9mIGBhbmd1bGFyLmVsZW1lbnRgIHRvIGF2b2lkIHRoZSBqUXVlcnktc3BlY2lmaWMgYGV2ZW50Lm9yaWdpbmFsRXZlbnRgXG4gICAgICAgICAgICAgICAgJ2xvY2FsU3RvcmFnZScgPT09IHN0b3JhZ2VUeXBlICYmICR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAmJiAkd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ25nU3RvcmFnZS0nID09PSBldmVudC5rZXkuc2xpY2UoMCwgMTApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5uZXdWYWx1ZSA/ICRzdG9yYWdlW2V2ZW50LmtleS5zbGljZSgxMCldID0gYW5ndWxhci5mcm9tSnNvbihldmVudC5uZXdWYWx1ZSkgOiBkZWxldGUgJHN0b3JhZ2VbZXZlbnQua2V5LnNsaWNlKDEwKV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIF9sYXN0JHN0b3JhZ2UgPSBhbmd1bGFyLmNvcHkoJHN0b3JhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJHN0b3JhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG59KSgpO1xuIiwiLyoqXG4vKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgOC8zMS8yMDE1XG4gKiBAbmFtZSBBdXRob3JpemVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgSG9tZSBwYWdlXG4gKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ0F1dGhvcml6ZWRDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJGxvY2FsU3RvcmFnZSl7XG4gICAgLy9DaGVjayBpZiBsb2NhbFN0b3JhZ2UgaGFzIGEgbWVzc2FnZSB0byBkaXNwbGF5XG4gICAgaWYgKCAkbG9jYWxTdG9yYWdlLm1lc3NhZ2UgKXtcbiAgICAgICAgLy9TZXQgdGhlIG5ld01lc3NhZ2UgdG8gdHJ1ZSBzbyB0aGF0IGl0IHdpbGwgc2hvdyBvbiB0aGUgaG9tZSBwYWdlXG4gICAgICAgICRzY29wZS5uZXdNZXNzYWdlID0gdHJ1ZTtcbiAgICAgICAgLy9TZXQgdGhlIG1lc3NhZ2UgdG8gdGhlIHNjb3BlIHNvIHRoYXQgd2UgY2FuIHJlbmRlciBpdCBpbiB0aGUgdmlld1xuICAgICAgICAkc2NvcGUuV2VsY29tZU1lc3NhZ2UgPSAkbG9jYWxTdG9yYWdlLm1lc3NhZ2U7XG4gICAgfWVsc2V7XG4gICAgICAgIC8vTm8gbWVzc2FnZSBpbiB0aGUgbG9jYWxTdG9yYWdlLCBzbyBzZXQgbmV3TWVzc2FnZSB0byBmYWxzZVxuICAgICAgICAkc2NvcGUubmV3TWVzc2FnZSA9IGZhbHNlO1xuICAgICAgICAvL0Rpc3BsYXkgdGhlIGRlZmF1bHQgbWVzc2FnZVxuICAgICAgICAkc2NvcGUuV2VsY29tZU1lc3NhZ2UgPSAnJCRXZWxjb21lTWVzc2FnZSQkJztcbiAgICB9XG4gICAgLy9EZXN0b3J5IHRoZSBtZXNzYWdlIGluIHRoZSBsb2NhbFN0b3JhZ2Ugbm93IHRoYXQgd2UgaGF2ZSBkaXNwbGF5ZWQgaXQgaW4gdGhlIHNjb3BlXG4gICAgJGxvY2FsU3RvcmFnZS5tZXNzYWdlID0gbnVsbDtcbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBEcmFmdEN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIERyYWZ0IHBhZ2VcbiAqL1xuLyogZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ0RyYWZ0Q3RybCcsIGZ1bmN0aW9uIChBUEksICRzY29wZSl7XG4gICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy9kcmFmdCcpO1xuICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIGRyYWZ0IHN0YXR1c1xuICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgdGhlIHZpZXcgd2l0aCB0aGUgZGF0YVxuICAgICAgICAkc2NvcGUuY2FzZXNMaXN0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgaWYoJHNjb3BlLmNhc2VzTGlzdC5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgIC8vI2Nhc2VzLXRhYmxlIGlzIHRoZSBhcmVhIG9uIHRoZSBwYWdlIHdlIGFyZSByZW5kZXJpbmdcbiAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgY2FzZXMsIHNvIHdlIGFyZSBzZXR0aW5nIGl0J3MgSFRNTCBlcXVhbCB0byB0aGUgZGlzcGxheSBtZXNzYWdlXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJCgnI2Nhc2VzLXRhYmxlJykuaHRtbChcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nK1xuICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLW9rIGJsdWVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBEeW5hZm9ybUN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIER5bmFmb3JtXG4gKi9cbi8qZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ0R5bmFmb3JtQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgJGxvY2FsU3RvcmFnZSwgQVBJKSB7XG5cbiAgICAgICAgLy9JbnN0YW50aWF0ZSB0aGUgZHluYWZvcm0gb2JqZWN0IHNvIHRoYXQgd2UgY2FuIGFzc2lnbiBwcm9wZXJ0aWVzIHRvIGl0XG4gICAgICAgICRzY29wZS5keW5hZm9ybSA9IHt9O1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0LycrJGxvY2FsU3RvcmFnZS5wcm9fdWlkKycvYWN0aXZpdHkvJyskbG9jYWxTdG9yYWdlLmFjdF91aWQrJy9zdGVwcycpO1xuICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBzdGVwc1xuICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAvL0dldCB0aGUgZmlyc3Qgb2JqZWN0L2Zvcm0gZm9yIHRoZSBkZW1vIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAvL0luIGEgcmVhbCB3b3JsZCBleGFtcGxlIHlvdSB3b3VsZCBoYXZlIHRvIGJ1aWxkIGxvZ2ljIGF0IHRoaXMgcG9pbnQgdG9cbiAgICAgICAgICAgIC8vRGlzcGxheSB0aGUgYXBwcm9wcmlhdGUgc3RlcHNcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkeW5hZm9ybSB1aWQgLyBzdGVwIHVpZCB0byBsb2NhbFN0b3JhZ2UgZm9yIHBlcnNpc3RlbmNlXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnN0ZXBfdWlkX29iaiA9IHJlc3BvbnNlLmRhdGFbMF0uc3RlcF91aWRfb2JqO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3QvJyskbG9jYWxTdG9yYWdlLnByb191aWQrJy9keW5hZm9ybS8nKyRsb2NhbFN0b3JhZ2Uuc3RlcF91aWRfb2JqKTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSByZXF1ZXN0aW5nIGR5bmFmb3JtIGRlZmluaXRpb24gaW4gb3JkZXIgdG8gcmVuZGVyIHRoZSBmb3JtXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGR5bmFmb3JtQ29udGVudCA9IEpTT04ucGFyc2UocmVzcG9uc2UuZGF0YS5keW5fY29udGVudCk7XG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5keW5fdWlkID0gcmVzcG9uc2UuZGF0YS5keW5fdWlkO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5tYWluVGl0bGUgPSByZXNwb25zZS5kYXRhLmR5bl90aXRsZTtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRzID0gZHluYWZvcm1Db250ZW50Lml0ZW1zWzBdLml0ZW1zO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5hcHBfbnVtYmVyID0gJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5maWVsZHMgPSBmaWVsZHM7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmR5bmFmb3JtLnN1Ym1pdCA9IGZpZWxkc1tmaWVsZHMubGVuZ3RoLTFdWzBdO1xuICAgICAgICAgICAgICAgICRzY29wZS5sb2FkQ2FzZURhdGEoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzdWJtaXRDYXNlXG4gICAgICAgICAqIEBkZXNjIFN1Ym1pdHMgdGhlIGZvcm0gdG8gUHJvY2Vzc01ha2VyIHRvIHNhdmUgdGhlIGRhdGEgYW5kIHRha2VzIHRoZSB1c2VyIGJhY2sgdG8gdGhlaXIgaW5ib3hcbiAgICAgICAgICovXG5cbiAgICAgICAgJHNjb3BlLnN1Ym1pdENhc2UgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy9TZXQgdGhlIGRlbGVnYXRpb24gaW5kZXggZXF1YWwgdG8gMSBpZiB0aGVyZSBpcyBubyBkZWxlZ2F0aW9uIGluZGV4LCB0aGlzIHdvdWxkIG1lYW4gdGhhdCB0aGUgY2FzZSBpc1xuICAgICAgICAgICAgLy9DdXJyZW50bHkgaW4gZHJhZnQgc3RhdHVzLCBvdGhlcndpc2UsIGlmIHRoZSBkZWxlZ2F0aW9uIGlzIG5vdCBudWxsLCBqdXN0IGFzc2lnbiBpdCB2YWx1ZSBvZiB0aGUgZGVsZWdhdGlvblxuICAgICAgICAgICAgLy9pbmRleFxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5kZWxJbmRleCA9ICgkbG9jYWxTdG9yYWdlLmRlbEluZGV4ID09PSBudWxsKSA/IDEgOiAkbG9jYWxTdG9yYWdlLmRlbEluZGV4O1xuICAgICAgICAgICAgLy9JbnN0YW50aWF0ZSBhbiBvYmplY3QgaW4gb3JkZXIgdG8gdXNlIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IHRoYXQgd2Ugd2lsbCBiZSBzZW5kaW5nIHRvIFByb2Nlc3NNYWtlclxuICAgICAgICAgICAgLy9JbiB0aGUgLmVhY2ggbG9vcFxuICAgICAgICAgICAgdmFyIGRhdGFPYmogPSB7fTtcbiAgICAgICAgICAgIC8vSGVyZSB3ZSBnZXQgYWxsIHRoZSBpbnB1dCBlbGVtZW50cyBvbiB0aGUgZm9ybSBhbmQgcHV0IHRoZW0gaW50byB0aGUgb2JqZWN0IGNyZWF0ZWQgYWJvdmVcbiAgICAgICAgICAgIC8vVG9EbyBzdXBwb3J0IGZvciBvdGhlciBlbGVtZW50cyBiZXNpZGVzIGlucHV0IGUuZy4gc2VsZWN0LCB0ZXh0YXJlYSwgcmFkaW8sIGNoZWNrXG4gICAgICAgICAgICAkKCdmb3JtJykuZmluZCgnOmlucHV0JykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIC8vV2UgZmlyc3QgY2hlY2sgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGZpZWxkIGhhcyBhIHByb3BlciBpZFxuICAgICAgICAgICAgICAgIC8vVGhlbiB3ZSBhc3NpZ24gdG8gdGhlIG9iamVjdCBhIGtleSBvZiB0aGUgZmllbGQgaWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YoJCh0aGlzKS5hdHRyKCdpZCcpKSAhPT0gJ3VuZGVmaW5lZCcgKSBkYXRhT2JqWyQodGhpcykuYXR0cignaWQnKV0gPSAkKHRoaXMpLnZhbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJyskbG9jYWxTdG9yYWdlLmFwcF91aWQrJy92YXJpYWJsZScpO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHB1dCByZXF1ZXN0XG4gICAgICAgICAgICBBUEkuc2V0UGFyYW1zKGRhdGFPYmopO1xuICAgICAgICAgICAgLy9NYWtlIGEgY2FsbCB0byB0aGUgQVBJIHRvIHN1Ym1pdCB0aGUgZGF0YSB0byBiZSBzYXZlZCB0byB0aGUgY2FzZXMgdmFyaWFibGVzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgcmVzcG9uc2UgaXMgbm90IGVxdWFsIHRvIDAgdGhhbiB3ZSBrbm93IHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UhPT0wKXtcbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJyskbG9jYWxTdG9yYWdlLmFwcF91aWQrJy9yb3V0ZS1jYXNlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IHRoZSBwYXJhbXMgZm9yIHRoZSBwdXQgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICBBUEkuc2V0UGFyYW1zKHsnZGVsX2luZGV4JzogJGxvY2FsU3RvcmFnZS5kZWxJbmRleCwgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTgnfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSB0byByb3V0ZSB0aGUgY2FzZSB0byB0aGUgbmV4dCB0YXNrXG4gICAgICAgICAgICAgICAgICAgIC8vU29tZXRoaW5nIHRvIG5vdGUgZm9yIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRzOlxuICAgICAgICAgICAgICAgICAgICAvL1RoaXMgc3BlY2lmaWMgd29ya2Zsb3cgd2FzIGEgc2VxdWVudGlhbCB3b3JrZmxvdy4gRm9yIHByb2R1Y3Rpb24gZW52aXJvbmVtbnRzIHlvdSBtYXkgbmVlZCB0byBhZGRcbiAgICAgICAgICAgICAgICAgICAgLy9DdXN0b20gbG9naWMgZm9yIGludGVycHJldGluZyB0aGUgcm91dGluZyBwcm9jZWR1cmUgZm9yIG90aGVyIHR5cGVzIG9mIHJvdXRpbmcgcnVsZXNcbiAgICAgICAgICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVzZXQgdGhlIGRlbGVnYXRpb24gaW5kZXggc2luY2Ugd2UgaGF2ZSBzdWJtaXR0ZWQgdGhlIGZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9SZXNldCB0aGUgYXBwbGljYXRpb25zIHVuaXF1ZSBpZGVudGlmaWVyIHNpbmNlIHdlIGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFwcF91aWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9TZW5kIHRoZSB1c2VyIGJhY2sgdG8gdGhlaXIgaG9tZSBpbmJveCBzaW5jZSB0aGV5IGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24udXJsKCcvaG9tZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9EaXNwbGF5IGEgdXNlciBmcmllbmRseSBtZXNzYWdlIHRvIHRoZSB1c2VyIHRoYXQgdGhleSBoYXZlIHN1Y2Nlc3NmdWxseSBzdWJtaXR0ZWQgdGhlIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UubWVzc2FnZSA9ICckJEZvcm1TdWJtaXR0ZWRNZXNzYWdlJCQnO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBVVFxuICAgICAgICAgICAgICAgICAgICAnUFVUJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vRGVmaW5lIHRoZSByZXF1ZXN0IHR5cGUsIGluIHRoaXMgY2FzZSwgUFVUXG4gICAgICAgICAgICAnUFVUJyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgbG9hZENhc2VEYXRhXG4gICAgICAgICAqIEBkZXNjIExvYWRzIHRoZSBkYXRhIGZyb20gdGhlIGNhc2UgYW5kIHBvcHVsYXRlcyB0aGUgZm9ybSB3aXRoIGl0XG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUubG9hZENhc2VEYXRhID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy8nKyRsb2NhbFN0b3JhZ2UuYXBwX3VpZCsnL3ZhcmlhYmxlcycpO1xuICAgICAgICAgICAgLy9NYWtlIGEgY2FsbCB0byB0aGUgQVBJIHJlcXVlc3RpbmcgdGhlIGRhdGEgb2YgdGhlIGNhc2VcbiAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAvL0lmIHRoZSBsZW5ndGggb2YgdGhlIGRhdGEgaXMgZ3JlYXRlciB0aGFuIDAsIHdlIGtub3cgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBpZigkKHJlc3BvbnNlLmRhdGEpLnNpemUoKSA+IDApe1xuICAgICAgICAgICAgICAgICAgICAvL0Fzc2lnbiB0aGUgcmVzcG9uc2UgdG8gYSB2YXJpYWJsZSBmb3IgZWFzaWVyIHVzZVxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIC8vTG9vcCB0aHJvdWdoIGFsbCB0aGUgaW5wdXQgZWxlbWVudHMgb24gdGhlIGZvcm0gYW5kIHBvcHVsYXRlIHRoZW0gd2l0aCB0aGUgZGF0YSByZXRyaWV2ZWQgZnJvbSB0aGUgQVBJXG4gICAgICAgICAgICAgICAgICAgIC8vVG9EbyBzdXBwb3J0IGZvciBvdGhlciBlbGVtZW50cyBiZXNpZGVzIGlucHV0IGUuZy4gc2VsZWN0LCB0ZXh0YXJlYSwgcmFkaW8sIGNoZWNrXG4gICAgICAgICAgICAgICAgICAgICQoJ2Zvcm0nKS5maW5kKCc6aW5wdXQnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1dlIGZpcnN0IGNoZWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBmaWVsZCBoYXMgYSBwcm9wZXIgaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vVGhlbiB3ZSBhc3NpZ24gdG8gdGhlIGZpZWxkJ3MgdmFsdWUgd2l0aCB0aGUgYXNzb2NpYXRlZCBmaWVsZCByZXR1cm5lZCBmcm9tIHRoZSBBUElcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mKCQodGhpcykuYXR0cignaWQnKSkgIT09ICd1bmRlZmluZWQnICkgJCh0aGlzKS52YWwoZGF0YVskKHRoaXMpLmF0dHIoJ2lkJyldKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgSG9tZUN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIEhvbWUgcGFnZVxuICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhbFN0b3JhZ2Upe1xuICAgIC8vQ2hlY2sgaWYgbG9jYWxTdG9yYWdlIGhhcyBhIG1lc3NhZ2UgdG8gZGlzcGxheVxuICAgIGlmICggJGxvY2FsU3RvcmFnZS5tZXNzYWdlICl7XG4gICAgICAgIC8vU2V0IHRoZSBuZXdNZXNzYWdlIHRvIHRydWUgc28gdGhhdCBpdCB3aWxsIHNob3cgb24gdGhlIGhvbWUgcGFnZVxuICAgICAgICAkc2NvcGUubmV3TWVzc2FnZSA9IHRydWU7XG4gICAgICAgIC8vU2V0IHRoZSBtZXNzYWdlIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgaXQgaW4gdGhlIHZpZXdcbiAgICAgICAgJHNjb3BlLldlbGNvbWVNZXNzYWdlID0gJGxvY2FsU3RvcmFnZS5tZXNzYWdlO1xuICAgIH1lbHNle1xuICAgICAgICAvL05vIG1lc3NhZ2UgaW4gdGhlIGxvY2FsU3RvcmFnZSwgc28gc2V0IG5ld01lc3NhZ2UgdG8gZmFsc2VcbiAgICAgICAgJHNjb3BlLm5ld01lc3NhZ2UgPSBmYWxzZTtcbiAgICAgICAgLy9EaXNwbGF5IHRoZSBkZWZhdWx0IG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLldlbGNvbWVNZXNzYWdlID0gJyQkV2VsY29tZU1lc3NhZ2UkJCc7XG4gICAgfVxuICAgIC8vRGVzdG9yeSB0aGUgbWVzc2FnZSBpbiB0aGUgbG9jYWxTdG9yYWdlIG5vdyB0aGF0IHdlIGhhdmUgZGlzcGxheWVkIGl0IGluIHRoZSBzY29wZVxuICAgICRsb2NhbFN0b3JhZ2UubWVzc2FnZSA9IG51bGw7XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgSW5ib3hDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBJbmJveCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdJbmJveEN0cmwnLCBmdW5jdGlvbiAoQVBJLCAkc2NvcGUpe1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcycpO1xuICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiBUbyBEbyBzdGF0dXNcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgdGhlIHZpZXcgd2l0aCB0aGUgZGF0YVxuICAgICAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAvL0lmIHRoZSByZXN1bHRpbmcgZGF0YSBsZW5ndGggaXMgZXF1YWwgdG8gMCwgdGhlbiB3ZSBkaXNwbGF5IGEgdXNlciBmcmllbmRseVxuICAgICAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVG9kbyBjcmVhdGUgc29tZSB0eXBlIG9mIGRpcmVjdGl2ZS9zZXJ2aWNlIHRvIHJlbmRlciBtZXNzYWdlcyBpbiB0aGUgYXBwbGljYXRpb24gd2l0aCBqdXN0IGEgcXVpY2sgZnVuY3Rpb24gY2FsbFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICQoJyNjYXNlcy10YWJsZScpLmh0bWwoXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtaW5mb1wiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tb2sgYmx1ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyQkTm9DYXNlc01lc3NhZ2UkJCcrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBOZXdjYXNlQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgTmV3IENhc2UgcGFnZVxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdOZXdjYXNlQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UsIEFQSSl7XG4gICAgICAgIC8vQXNzaWduIHRoZSBsaXN0IG9mIHN0YXJ0aW5nIHRhc2tzIGZyb20gbG9jYWxTdG9yYWdlIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgaXQgaW4gdGhlIHZpZXdcbiAgICAgICAgJHNjb3BlLnRhc2tMaXN0ID0gJGxvY2FsU3RvcmFnZS5zdGFydGluZ1Rhc2tzO1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIHN0YXJ0Q2FzZVxuICAgICAgICAgKiBAZGVzYyBTdGFydHMgYSBuZXcgY2FzZSBpbiBQcm9jZXNzTWFrZXJcbiAgICAgICAgICovXG4gICAgICAgICRzY29wZS5zdGFydENhc2UgPSBmdW5jdGlvbihhY3RfdWlkKXtcbiAgICAgICAgICAgIC8vU2V0dGluZyB0aGUgYWN0aXZpdHkgdWlkIHRvIGxvY2FsU3RvcmFnZSBmb3IgbGF0ZXIgdXNlXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFjdF91aWQgPSBhY3RfdWlkO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzJyk7XG4gICAgICAgICAgICAvL1NldCB0aGUgcGFyYW1zIGZvciB0aGUgcG9zdCByZXF1ZXN0XG4gICAgICAgICAgICBBUEkuc2V0UGFyYW1zKHtwcm9fdWlkOiAkbG9jYWxTdG9yYWdlLnByb191aWQsIHRhc191aWQ6ICRsb2NhbFN0b3JhZ2UuYWN0X3VpZH0pO1xuICAgICAgICAgICAgLy9NYWtlIGEgY2FsbCB0byB0aGUgUkVTVCBBUEkgdG8gc3RhcnQgYSBjYXNlXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhIHJldHVybmVkIGZyb20gdGhlIEFQSSBpcyBncmVhdGVyIHRoYW4gMCwgdGhlbiB3ZSBrbm93IHdlJ3JlIGluIGJ1c2luZXNzIVxuICAgICAgICAgICAgICAgIGlmKCAkKHJlc3BvbnNlLmRhdGEpLnNpemUoKSA+IDAgKXtcbiAgICAgICAgICAgICAgICAgICAgLy9TZW5kIHRoZSB1c2VyIHRvIHRoZSBvcGVuY2FzZSBwYWdlLCB0aGVyZSB3ZSBkaXNwbGF5IHRoZSBkeW5hZm9ybVxuICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24udXJsKCcvb3BlbmNhc2UnKTtcbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIGxvY2FsU3RvcmFnZSBhcHBsaWNhdGlvbiB1bmlxdWUgaWRlbnRpZmllciB0byB0aGF0IHdoaWNoIHdhcyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gcmVzcG9uc2UuZGF0YS5hcHBfdWlkO1xuICAgICAgICAgICAgICAgICAgICAvL1NldCB0aGUgbG9jYWxTdG9yYWdlIGFwcGxpY2F0aW9uIG51bWJlciB0byB0aGF0IHdoaWNoIHdhcyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyID0gcmVzcG9uc2UuZGF0YS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBPU1RcbiAgICAgICAgICAgICdQT1NUJyk7XG4gICAgICAgIH07XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgTmV3cHJvY2Vzc0N0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIE5ldyBQcm9jZXNzIFBhZ2VcbiAqL1xuLypnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignTmV3cHJvY2Vzc0N0cmwnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCBBUEkpe1xuICAgICAgICAkc2NvcGUuZ2V0UHJvY2Vzc0xpc3QgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3QnKTtcbiAgICAgICAgICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBwcm9jZXNzZXNcbiAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZGF0YSByZWNlaXZlZCBmcm9tIHRoZSBBUEkgdG8gdGhlIHNjb3BlIHNvIHRoYXQgd2VcbiAgICAgICAgICAgICAgICAvL0NhbiByZW5kZXIgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICAgICAkc2NvcGUucHJvTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgICAgICAvL01lc3NhZ2Ugc3RhdGluZyB0aGF0IHRoZXJlIGlzIG5vdGhpbmcgdG8gZGlzcGxheVxuICAgICAgICAgICAgICAgIGlmKCRzY29wZS5wcm9MaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgICAgICAvLyNuZXctcHJvY2Vzcy1hcmVhIGlzIHRoZSBhcmVhIG9uIHRoZSBwYWdlIHdlIGFyZSByZW5kZXJpbmdcbiAgICAgICAgICAgICAgICAgICAgLy9UaGUgbGlzdCBvZiBwcm9jZXNzZXMsIHNvIHdlIGFyZSBzZXR0aW5nIGl0J3MgSFRNTCBlcXVhbCB0byB0aGUgZGlzcGxheSBtZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICQoJyNuZXctcHJvY2Vzcy1hcmVhJykuaHRtbCgnJCROb1Byb2Nlc3Nlc1RvRGlzcGxheU1lc3NhZ2UkJCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSgpOy8vV2UgYXV0byBpbnN0YW50aWF0ZSB0aGUgbWV0aG9kIGluIG9yZGVyIHRvIGhhdmUgaXQgZ2V0IHRoZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBBUEkgYW5kIGRpc3BsYXkgb24gbG9hZCBvZiB0aGUgY29udHJvbGxlclxuXG4gICAgICAgIC8vVGhpcyBtZXRob2Qgc3RhcnRzIGEgcHJvY2VzcyBhbmQgZ2V0cyB0aGUgYXNzb2NpYXRlZCBzdGFydGluZyB0YXNrcyBvZiB0aGUgcHJvY2VzcyBhbmQgZGlzcGxheXMgdGhlbVxuICAgICAgICAvL0l0IHRha2VzIG9uZSBwYXJhbSwgdGhlIHByb2Nlc3MgdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB3ZSB3YW50IHRvIHN0YXJ0XG4gICAgICAgICRzY29wZS5zdGFydFByb2Nlc3MgPSBmdW5jdGlvbihwcm9fdWlkKXtcbiAgICAgICAgICAgIC8vU2V0dGluZyB0aGUgcHJvY2VzcyB1aWQgdG8gbG9jYWxTdG9yYWdlIGZvciBsYXRlciB1c2VcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UucHJvX3VpZCA9IHByb191aWQ7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL3N0YXJ0aW5nLXRhc2tzJyk7XG4gICAgICAgICAgICAvL0NhbGwgdG8gdGhlIFJFU1QgQVBJIHRvIGxpc3QgYWxsIGF2YWlsYWJsZSBzdGFydGluZyB0YXNrcyBmb3IgdGhlIHNwZWNpZmllZCBwcm9jZXNzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9TZW5kIHRoZSBsaXN0IG9mIG5ldyBjYXNlcyB0byBsb2NhbFN0b3JhZ2Ugc28gdGhhdCB0aGUgTmV3Y2FzZUN0cmwgY29udHJvbGxlciBjYW4gdXNlIGl0XG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5zdGFydGluZ1Rhc2tzID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAvL0NoYW5nZSB0aGUgdXJsIHNvIHRoYXQgdGhlIG5ldyBjYXNlIHBhZ2UgaXMgZGlzcGxheWVkXG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL25ld2Nhc2UnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBQYXJ0aWNpcGF0ZWRDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBQYXJ0aWNpcGF0ZWQgcGFnZVxuICovXG4vKiBnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignUGFydGljaXBhdGVkQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEFQSSkge1xuICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvcGFydGljaXBhdGVkJyk7XG4gICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2YgY2FzZXMgaW4gcGFydGljaXBhdGVkIHN0YXR1c1xuICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgdGhlIHZpZXcgd2l0aCB0aGUgZGF0YVxuICAgICAgICAkc2NvcGUuY2FzZXNMaXN0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgaWYoJHNjb3BlLmNhc2VzTGlzdC5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVG9kbyBjcmVhdGUgc29tZSB0eXBlIG9mIGRpcmVjdGl2ZS9zZXJ2aWNlIHRvIHJlbmRlciBtZXNzYWdlcyBpbiB0aGUgYXBwbGljYXRpb24gd2l0aCBqdXN0IGEgcXVpY2sgZnVuY3Rpb24gY2FsbFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5odG1sKFxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtaW5mb1wiPicrXG4gICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwiYWxlcnRcIj4nK1xuICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JytcbiAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1vayBibHVlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgUm9vdEN0cmxcbiAqIEBkZXNjIFRoaXMgaXMgdGhlIHJvb3QgY29udHJvbGxlci4gSXQgY29udHJvbHMgYXNwZWN0cyByZWxhdGVkIHRvIHRoZSBhcHBsaWNhdGlvbiBmcm9tIGEgaGlnaGVyIGxldmVsXG4gKi9cbi8qZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ1Jvb3RDdHJsJywgZnVuY3Rpb24gUm9vdEN0cmwoJHJvb3RTY29wZSwgJHNjb3BlLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UsICRzdGF0ZSwgJGh0dHAsIEFQSSwgYXBwVGl0bGUsIGdlbmVyaWNIZWFkZXJzLCBhY3RpdmVNZW51SXRlbXMsIGFwaV91cmwsIEFjY2Vzc1Rva2VuKXtcbiAgICAvL0RlZmluZSB0aGUgY29sdW1uIG5hbWVzIGZvciB0aGUgZ3JpZHMuIEluIHRoaXMgY2FzZSwgd2UgYXJlIGNyZWF0aW5nIGdsb2JhbCBjb2x1bW5zLCBidXQgeW91IGNvdWxkIGp1c3QgcmVkZWZpbmUgdGhpcyBhcnJheSBvbiBhbnkgY29udHJvbGxlclxuICAgIC8vVG8gb3ZlcndyaXRlIHRoZW0gZm9yIGEgc3BlY2lmaWMgcGFnZVxuICAgICRzY29wZS5ncmlkSGVhZGVycyA9IGdlbmVyaWNIZWFkZXJzO1xuICAgIC8vRGVmaW5lIHRoZSBhcHBsaWNhdGlvbiB0aXRsZSBhbmQgc2V0IGl0IHRvIHRoZSBzY29wZSBzbyB0aGF0IHRoZSB2aWV3IHJlbmRlcnMgaXRcbiAgICAkc2NvcGUuYXBwVGl0bGUgPSBhcHBUaXRsZTtcbiAgICAvL1RoaXMgZnVuY3Rpb24gc2V0cyB0aGUgc2lkZWJhciBtZW51IHRvIGFjdGl2ZSBiYXNlZCBvbiB0aGUgcGFnZSBzZWxlY3RlZFxuICAgICRzY29wZS5zZXRTZWxlY3RlZFBhZ2UgPSBmdW5jdGlvbihjdXJyZW50UGFnZSl7XG4gICAgICAgIC8vTGlzdCBvZiBhbGwgdGhlIG1lbnUgaXRlbXMgc28gdGhhdCB3ZSBjYW4gbG9vcCB0aHJvdWdoIHRoZW1cbiAgICAgICAgdmFyIGxpc3QgPSBhY3RpdmVNZW51SXRlbXM7XG4gICAgICAgIC8vTG9vcCB0aHJvdWdoIGFsbCB0aGUgbWVudSBpdGVtc1xuICAgICAgICAkLmVhY2gobGlzdCwgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XG4gICAgICAgICAgICAvL0NoZWNrIGlmIHRoZSBjdXJyZW50IHBhZ2UgaXMgZXF1YWwgYSBrZXlcbiAgICAgICAgICAgIC8vSWYgaXQgaXMsIG1ha2UgaXQgYWN0aXZlXG4gICAgICAgICAgICBpZihjdXJyZW50UGFnZSA9PT0ga2V5KSAkc2NvcGVbdmFsdWVdID0gJ2FjdGl2ZSc7XG4gICAgICAgICAgICAvL090aGVyd2lzZSwgbWFrZSB0aGUgcmVzdCBvZiB0aGVtIGluYWN0aXZlIHNvIG9ubHkgdGhlIGN1cnJlbnRseSBhY3RpdmUgb25lIGlzIGRpc3BsYXllZCBhcyBhY3RpdmVcbiAgICAgICAgICAgIGVsc2UgJHNjb3BlW3ZhbHVlXSA9ICcnO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQG5hbWUgISEhRXZlbnRzISEhXG4gICAgICAgICAqIEBkZXNjIFRoaXMgaXMgd2hlcmUgd2Ugd2lsbCBkZWZpbmUgYSBidW5jaCBvZiBldmVudHMgYW5kIHdoYXQgaGFwcGVucyBkdXJpbmcgdGhvc2UgZXZlbnRzXG4gICAgICAgICAqIEBkZXNjIEZ1biBzdHVmZiEhISFcbiAgICAgICAgICovXG4gICAgLy9XaGVuIHRoZSBhcHBsaWNhdGlvbnMgc3RhdGUgaGFzIGNoYW5nZWQgdG8gYW5vdGhlciByb3V0ZSwgd2Ugd2FudCB0byBmaXJlIHNvbWUgdGhpbmdzIG9uIHRoaXMgZXZlbnRcbiAgICAkc2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpe1xuICAgICAgICAvL0NoYW5nZSB0aGUgbWVudSBpdGVtIHNlbGVjdGVkIGFzIGFjdGl2ZSB3aGVuZXZlciB0aGUgcGFnZSBpcyBjaGFuZ2VkXG4gICAgICAgICRzY29wZS5zZXRTZWxlY3RlZFBhZ2UodG9TdGF0ZS5jdXJyZW50UGFnZSk7XG4gICAgICAgIC8vU2V0IHRoZSBjdXJyZW50IHBhZ2VzIG5hbWUgdG8gdGhlIGN1cnJlbnQgcGFnZVxuICAgICAgICAkc2NvcGUuY3VycmVudFBhZ2UgPSB0b1N0YXRlLmN1cnJlbnRQYWdlO1xuICAgICAgICAvL1NldCB0aGUgY3VycmVudCBwYWdlcyBkZXNjcmlwdGlvbiB0byB0aGUgY3VycmVudCBwYWdlcyBkZXNjcmlwdGlvblxuICAgICAgICAkc2NvcGUucGFnZURlc2MgPSB0b1N0YXRlLnBhZ2VEZXNjO1xuICAgICAgICAvL1dlIHdhbnQgdG8gZGVzdHJveSB0aGUgZGVsZWdhdGlvbiBpbmRleCBpZiB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCBhIGR5bmFmb3JtIHNvIHRoYXQgdGhlIG5leHQgdGltZVxuICAgICAgICAvL1dlIGxvYWQgYSBwYWdlLCBpdCBkb2VzIG5vdCB1c2UgYSBkZWxlZ2F0aW9uIGluZGV4IG9mIGEgZGlmZmVyZW50IGFwcGxpY2F0aW9uXG4gICAgICAgIGlmKCRzY29wZS5jdXJyZW50UGFnZSAhPT0gJ0R5bmFmb3JtJykgJGxvY2FsU3RvcmFnZS5kZWxJbmRleCA9IG51bGw7XG4gICAgICAgIC8vRHVyaW5nIHRoZSBhdXRoZW50aWNhdGlvbiBwcm9jZXNzIHRoZSBodHRwIGhlYWRlcnMgY291bGQgaGF2ZSBjaGFuZ2VkIHRvIEJhc2ljXG4gICAgICAgIC8vU28gd2UganVzdCByZWluZm9yY2UgdGhlIGhlYWRlcnMgd2l0aCB0aGUgQmVhcmVyIGF1dGhvcml6YXRpb24gYXMgd2VsbCBhcyB0aGUgdXBkYXRlZCBhY2Nlc3NfdG9rZW5cbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uQXV0aG9yaXphdGlvbiA9ICdCZWFyZXIgJyArICRsb2NhbFN0b3JhZ2UuYWNjZXNzVG9rZW47XG4gICAgfSk7XG4gICAgLy9XaGVuIHRoZSB1c2VyIGxvZ3MgaW4sIHdlIGRvIHNvbWUgdGhpbmdzIG9uIHRoaXMgZXZlbnRcbiAgICAkcm9vdFNjb3BlLiRvbignb2F1dGg6bG9naW4nLCBmdW5jdGlvbihldmVudCwgdG9rZW4pe1xuICAgICAgICAvL1RoaXMgaXMgRVhUUkVNRUxZIGltcG9ydGFudCAtIFRoZSB3aG9sZSBVSSBpcyByZW5kZXJlZCBiYXNlZCBvbiBpZiB0aGlzIGlzIGFuIGFjY2VzX3Rva2VuXG4gICAgICAgIC8vU28sIHdlIGFzc2lnbiB0aGUgc2NvcGVzIGFjY2Vzc1Rva2VuIHRvIHRoZSB0b2tlblxuICAgICAgICAvL0lmIHRoZSB1c2VyIGlzIG5vdCBsb2dnZWQgaW4sIHRoZSB0b2tlbiBvYmplY3Qgd2lsbCBiZSB1bmRlZmluZWRcbiAgICAgICAgLy9JZiB0aGUgdXNlciBJUyBsb2dnZWQgaW4sIHRoZSB0b2tlbiBvYmplY3Qgd2lsbCBob2xkIHRoZSB0b2tlbiBpbmZvcm1hdGlvblxuICAgICAgICAvL0UuZy4gYWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VuLCBleHBpcnkgZXRjXG4gICAgICAgICRsb2NhbFN0b3JhZ2UuYWNjZXNzVG9rZW4gPSB0b2tlbi5hY2Nlc3NfdG9rZW47XG4gICAgfSk7XG4gICAgLy9XaGVuIHRoZSB1c2VyIGxvZ3Mgb3V0LCB3ZSBkbyBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHJvb3RTY29wZS4kb24oJ29hdXRoOmxvZ291dCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vVGhlIHVzZXIgaGFzIGxvZ2dlZCBvdXQsIHNvIHdlIGRlc3Ryb3kgdGhlIGFjY2Vzc190b2tlblxuICAgICAgICAvL0JlY2F1c2Ugb2YgQW5ndWxhcnMgYXdlc29tZSBsaXZlIGRhdGEgYmluZGluZywgdGhpcyBhdXRvbWF0aWNhbGx5IHJlbmRlcnMgdGhlIHZpZXcgaW5uYXRlXG4gICAgICAgICRsb2NhbFN0b3JhZ2UuYWNjZXNzVG9rZW4gPSBudWxsO1xuICAgICAgICAvL0Rlc3RvcnkgdGhlIEFjY2Vzc1Rva2VuIG9iamVjdFxuICAgICAgICBBY2Nlc3NUb2tlbi5kZXN0cm95KCk7XG4gICAgICAgIC8vU2V0IHRoZSBwYWdlcyBuYW1lIHRvIGFuIHVuYXV0aG9yaXplZCBtZXNzYWdlXG4gICAgICAgICRzY29wZS5jdXJyZW50UGFnZSA9ICdQbGVhc2UgTG9naW4uJztcbiAgICAgICAgLy9TZXQgdGhlIHBhZ2VzIGRlc2NyaXB0aW9uIHRvIGFuIHVuYXV0aG9yaXplZCBtZXNzYWdlXG4gICAgICAgICRzY29wZS5wYWdlRGVzYyA9ICckJERlZmF1bHRXZWxjb21lTWVzc2FnZSQkJztcbiAgICAgICAgLy9SZWRpcmVjdCB0aGUgdXNlciBiYWNrIHRvIHRoZSBob21lIHBhZ2VcbiAgICAgICAgJGxvY2F0aW9uLnVybCgnL2hvbWUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAqIEBuYW1lIG9wZW5DYXNlXG4gICAgICogQGRlc2MgT3BlbnMgYSBkeW5hZm9ybSBhbmQgZGlzcGxheXMgdGhlIGRhdGEgZm9yIHRoZSB1c2VyXG4gICAgICogQHBhcmFtIGFwcF91aWQgLSByZXF1aXJlZCAtIHRoZSBhcHBsaWNhdGlvbiB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGNhc2UgeW91IHdpc2ggdG8gb3BlblxuICAgICAqIEBwYXJhbSBkZWxJbmRleCAtIHJlcXVpcmVkIC0gdGhlIGRlbGVnYXRpb24gaW5kZXggb2YgdGhlIGN1cnJlbnQgYXBwbGljYXRpb24gdGhhdCB5b3UgYXJlIG9wZW5pbmdcbiAgICAgKi9cbiAgICAkc2NvcGUub3BlbkNhc2UgPSBmdW5jdGlvbihhcHBfdWlkLCBkZWxJbmRleCl7XG4gICAgICAgIC8vSGlkZSB0aGUgdmlldyBvZiB0aGUgY2FzZXMgbGlzdCBzbyB0aGF0IHdlIGNhbiBkaXNwbGF5IHRoZSBmb3JtXG4gICAgICAgICQoJyNjYXNlcy10YWJsZScpLmhpZGUoKTtcbiAgICAgICAgLy9TaG93IHRoZSB2aWV3IG9mIHRoZSBmb3JtXG4gICAgICAgICQoJyNmb3JtLWFyZWEnKS5zaG93KCk7XG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJythcHBfdWlkKTtcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgaWYoICQocmVzcG9uc2UuZGF0YSkuc2l6ZSgpID4gMCApe1xuICAgICAgICAgICAgICAgIC8vQXNzaWduIHRoZSBsb2NhbFN0b3JhZ2UgZGF0YTpcbiAgICAgICAgICAgICAgICAvL1RoZSBhcHBsaWNhdGlvbnMgbnVtYmVyXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfbnVtYmVyID0gcmVzcG9uc2UuZGF0YS5hcHBfbnVtYmVyO1xuICAgICAgICAgICAgICAgIC8vVGhlIHByb2Nlc3MgdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB0aGUgY2FzZSBpcyBhc3NvY2lhdGVkIHRvXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5wcm9fdWlkID0gcmVzcG9uc2UuZGF0YS5wcm9fdWlkO1xuICAgICAgICAgICAgICAgIC8vVGhlIGFjdGl2aXR5L2Zvcm0gdW5pcXVlIGlkZW50aWZpZXIgdGhhdCB3ZSBhcmUgZ29pbmcgdG8gZGlzcGFseVxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYWN0X3VpZCA9IHJlc3BvbnNlLmRhdGEuY3VycmVudF90YXNrWzBdLnRhc191aWQ7XG4gICAgICAgICAgICAgICAgLy9UaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gYXBwX3VpZDtcbiAgICAgICAgICAgICAgICAvL1RoZSBkZWxlZ2F0aW9uIGluZGV4IG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBkZWxJbmRleDtcbiAgICAgICAgICAgICAgICAvL1JlZGlyZWN0IHRoZSB1c2VyIHRvIHRoZSBvcGVuY2FzZSBmb3JtIHdoZXJlIHdlIHdpbGwgZGlzcGxheSB0aGUgZHluYWZvcm1cbiAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL29wZW5jYXNlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoJGxvY2FsU3RvcmFnZS5hY2Nlc3NUb2tlbiAmJiAkbG9jYWxTdG9yYWdlLmFjY2Vzc1Rva2VuLmxlbmd0aCA+IDEpIHJldHVybiB0cnVlO1xuICAgIH1cbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBVbmFzc2lnbmVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgVW5hc3NpZ25lZCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdVbmFzc2lnbmVkQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEFQSSkge1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy91bmFzc2lnbmVkJyk7XG4gICAgICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIHVuYXNzaWduZWQgc3RhdHVzXG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5odG1sKFxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLW9rIGJsdWVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==