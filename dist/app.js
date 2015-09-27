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
    'ngRoute',              //application view and routing service
    'ui.bootstrap'          //Bootstrap framework for AngularJS
  ]);
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
angular.module('pmAngular').value('api_url', 'http://pm.stable/api/1.0/workflow/');
angular.module('pmAngular').value('config_object', {
		oauth_button : {
			text: 'My ProcessMaker Button',
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
.controller('RootCtrl', function RootCtrl($rootScope, $scope, $location, $localStorage, $route, $http, API, appTitle, genericHeaders, activeMenuItems, api_url, AccessToken){
    //Define the column names for the grids. In this case, we are creating global columns, but you could just redefine this array on any controller
    //To overwrite them for a specific page
    $scope.gridHeaders = genericHeaders;
    //Define the application title and set it to the scope so that the view renders it
    $scope.appTitle = appTitle;
    //This function sets the sidebar menu to active based on the page selected
    $scope.setSelectedPage = function(){
        //List of all the menu items so that we can loop through them
        var list = activeMenuItems;
        //Loop through all the menu items
        $.each(list, function(key, value){
            //Check if the current page is equal a key
            //If it is, make it active
            if($route.current.currentPage === key) $scope[value] = 'active';
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
    $scope.$on('$routeChangeSuccess', function(){
        //Change the menu item selected as active whenever the page is changed
        $scope.setSelectedPage();
        //Set the current pages name to the current page
        $scope.currentPage = $route.current.currentPage;
        //Set the current pages description to the current pages description
        $scope.pageDesc = $route.current.pageDesc;
        //We want to destroy the delegation index if the current page is not a dynaform so that the next time
        //We load a page, it does not use a delegation index of a different application
        if($scope.currentPage !== 'Dynaform') $localStorage.delIndex = null;
    });
    //When the user logs in, we do some things on this event
    $scope.$on('oauth:login', function(event, token){
        //This is EXTREMELY important - The whole UI is rendered based on if this is an acces_token
        //So, we assign the scopes accessToken to the token
        //If the user is not logged in, the token object will be undefined
        //If the user IS logged in, the token object will hold the token information
        //E.g. access_token, refresh_token, expiry etc
        $scope.accessToken = token.access_token;
        //During the authentication process the http headers could have changed to Basic
        //So we just reinforce the headers with the Bearer authorization as well as the updated access_token
        $http.defaults.headers.common.Authorization = 'Bearer ' + $scope.accessToken;
    });
    //When the user logs out, we do some things on this event
    $scope.$on('oauth:logout', function(){
        //The user has logged out, so we destroy the access_token
        //Because of Angulars awesome live data binding, this automatically renders the view innate
        $scope.accessToken = null;
        //Destory the AccessToken object
        AccessToken.destroy();
        //Set the pages name to an unauthorized message
        $scope.currentPage = 'Please Login.';
        //Set the pages description to an unauthorized message
        $scope.pageDesc = '$$DefaultWelcomeMessage$$';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbmZpZy5qcyIsIm5nLW9hdXRoLmpzIiwiYXBpLmpzIiwibmdzdG9yYWdlLmpzIiwiYXV0aG9yaXplZC5qcyIsImRyYWZ0LmpzIiwiZHluYWZvcm0uanMiLCJob21lLmpzIiwiaW5ib3guanMiLCJuZXdjYXNlLmpzIiwibmV3cHJvY2Vzcy5qcyIsInBhcnRpY2lwYXRlZC5qcyIsInJvb3QuanMiLCJ1bmFzc2lnbmVkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBuZ2RvYyBvdmVydmlld1xuICogQG5hbWUgcG1Bbmd1bGFyQXBwXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgcG1Bbmd1bGFyIGlzIGEgbmF0aXZlIEFuZ3VsYXJKUyBmcm9udCBlbmQgaW5ib3ggdGhhdCBjb25uZWN0cyB0byBQcm9jZXNzTWFrZXIgMy4wIFJFU1QgQVBJIHdpdGggT0F1dGggMi4wXG4gKlxuICogTWFpbiBtb2R1bGUgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICovXG4vL0NyZWF0ZSB0aGUgYXBwXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJywgW1xuICAgICdvYXV0aCcsXG4gICAgJ25nUm91dGUnLCAgICAgICAgICAgICAgLy9hcHBsaWNhdGlvbiB2aWV3IGFuZCByb3V0aW5nIHNlcnZpY2VcbiAgICAndWkuYm9vdHN0cmFwJyAgICAgICAgICAvL0Jvb3RzdHJhcCBmcmFtZXdvcmsgZm9yIEFuZ3VsYXJKU1xuICBdKTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8zMS8xNFxuICogQG5hbWUgY29uZmlnXG4gKiBAZGVzYyBDb25maWd1cmF0aW9uIGZpbGUgZm9yIHRoZSBwbUFuZ3VsYXIgYXBwXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCAnJGxvY2F0aW9uUHJvdmlkZXInLCAnJGh0dHBQcm92aWRlcicsICckYnJvd3NlclByb3ZpZGVyJywgZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkYnJvd3NlclByb3ZpZGVyKXtcbiAgICAvL0NvbmZpZ3VyZSB0aGUgdXJsIHJvdXRlcywgdGhpcyBpcyBiYXNpY2FsbHkgdGhlIG5hdmlnYXRpb24gb2YgdGhlIGFwcFxuICAgIC8vRm9yIGVhY2ggcm91dGUgd2UgZGVmaW5lIGl0J3MgYXNzb2NpYXRlZDogdGVtcGxhdGUsIGNvbnRyb2xsZXIsIHRlbXBsYXRlIHZhcmlhYmxlczogcGFnZSBuYW1lIGFuZCBkZXNjcmlwdGlvblxuICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG4gICAgICAgIHJlZGlyZWN0VG86ICdob21lJ1xuICAgIH0pLlxuICAgICAgICB3aGVuKCcvYXV0aG9yaXplZCcse1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9hdXRob3JpemVkLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvcml6ZWRDdHJsJyxcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnQXV0aG9yaXplZCcsXG4gICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBBdXRob3JpemVkIFBhZ2UhJ1xuICAgICAgICB9KS5cbiAgICAgICAgd2hlbignaG9tZScse1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ob21lLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnSG9tZScsXG4gICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBIb21lIFBhZ2UhJ1xuICAgICAgICB9KS5cbiAgICAgICAgd2hlbignL25ld3Byb2Nlc3MnLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL25ld3Byb2Nlc3MuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnTmV3cHJvY2Vzc0N0cmwnLFxuICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdOZXcgUHJvY2VzcycsXG4gICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBOZXcgUHJvY2VzcyBQYWdlISdcbiAgICAgICAgfSkuXG4gICAgICAgIHdoZW4oJy9uZXdjYXNlJywge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9uZXdjYXNlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ05ld2Nhc2VDdHJsJyxcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnTmV3IENhc2UnLFxuICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgTmV3IENhc2UgUGFnZSEnXG4gICAgICAgIH0pLlxuICAgICAgICB3aGVuKCcvb3BlbmNhc2UnLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2R5bmFmb3JtLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0R5bmFmb3JtQ3RybCcsXG4gICAgICAgICAgICBjdXJyZW50UGFnZTogJ0R5bmFmb3JtJyxcbiAgICAgICAgICAgIHBhZ2VEZXNjOiAnQW5ndWxhckpTIG1lZXRzIFByb2Nlc3NNYWtlciEgVGhpcyBpcyB5b3VyIER5bmFmb3JtIFBhZ2UhJ1xuICAgICAgICB9KS5cbiAgICAgICAgd2hlbignL2luYm94Jywge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9pbmJveC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbmJveEN0cmwnLFxuICAgICAgICAgICAgY3VycmVudFBhZ2U6ICdJbmJveCcsXG4gICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBJbmJveCBQYWdlISdcbiAgICAgICAgfSkuXG4gICAgICAgIHdoZW4oJy9kcmFmdCcsIHtcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvZHJhZnQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRHJhZnRDdHJsJyxcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlOiAnRHJhZnQnLFxuICAgICAgICAgICAgcGFnZURlc2M6ICdBbmd1bGFySlMgbWVldHMgUHJvY2Vzc01ha2VyISBUaGlzIGlzIHlvdXIgRHJhZnQgUGFnZSEnXG4gICAgICAgIH0pLlxuICAgICAgICB3aGVuKCcvcGFydGljaXBhdGVkJywge1xuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9wYXJ0aWNpcGF0ZWQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUGFydGljaXBhdGVkQ3RybCcsXG4gICAgICAgICAgICBjdXJyZW50UGFnZTogJ1BhcnRpY2lwYXRlZCcsXG4gICAgICAgICAgICBwYWdlRGVzYzogJ0FuZ3VsYXJKUyBtZWV0cyBQcm9jZXNzTWFrZXIhIFRoaXMgaXMgeW91ciBQYXJ0aWNpcGF0ZWQgUGFnZSEnXG4gICAgICAgIH0pLlxuICAgICAgICBvdGhlcndpc2Uoe1xuICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2hvbWUnXG4gICAgICAgIH0pO1xuXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnRXhwaXJlZEludGVyY2VwdG9yJyk7XG59XSlcbi5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJGh0dHAsICRicm93c2VyKXtcbiAgICAkcm9vdFNjb3BlLiRvbignb2F1dGg6bG9naW4nLCBmdW5jdGlvbihldmVudCwgdG9rZW4pe1xuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5BdXRob3JpemF0aW9uID0gJ0JlYXJlciAnICsgdG9rZW4uYWNjZXNzX3Rva2VuO1xuICAgIH0pO1xuICAgICRyb290U2NvcGUuJG9uKCdvYXV0aDpsb2dvdXQnLCBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZygnbG9nZ2VkIG91dCcpO1xuICAgIH0pO1xuXG5cbiAgICAgICAgLy9jb25zb2xlLmxvZygkYnJvd3Nlci5iYXNlSHJlZigpKTtcblxufSk7XG5cbi8vVGhlIHVybCBmb3IgdGhlIFJFU1QgQVBJXG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2FwaV91cmwnLCAnJCRBcGlVcmwkJCcpO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdjb25maWdfb2JqZWN0JywgJCRDb25maWdPYmplY3QkJCk7XG4vL0luamVjdCB0aGUgbmFtZSBvZiB0aGUgYXBwbGljYXRpb24gaW50byBvdXIgYXBwbGljYXRpb24gc28gdGhhdCB3ZSBjYW4gdXNlIGlpdFxuLy9XaGVuIHdlIHJlbmRlciB0aGUgcGFnZVxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLnZhbHVlKCdhcHBUaXRsZScsICckJEFwcFRpdGxlJCQnKTtcbi8vRGVmaW5lIHRoZSBnZW5lcmljIGhlYWRlciBmb3IgdGhlIGNhc2UgbGlzdCB2aWV3XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJykudmFsdWUoJ2dlbmVyaWNIZWFkZXJzJywgW1xuICAgIHt0aXRsZTogJ0Nhc2UgIyd9LFxuICAgIHt0aXRsZTogJ1Byb2Nlc3MnfSxcbiAgICB7dGl0bGU6ICdUYXNrJ30sXG4gICAge3RpdGxlOiAnU2VudCBCeSd9LFxuICAgIHt0aXRsZTogJ0R1ZSBEYXRlJ30sXG4gICAge3RpdGxlOiAnTGFzdCBNb2RpZmllZCd9LFxuICAgIHt0aXRsZTogJ1ByaW9yaXR5J31cbl0pO1xuLy9EZWZpbmUgdGhlIGFjdGl2ZSBtZW51IGl0ZW1zIGZvciB0aGUgYXBwbGljYXRpb25cbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKS52YWx1ZSgnYWN0aXZlTWVudUl0ZW1zJyxcbiAgICB7XG4gICAgICAgICdOZXcgUHJvY2VzcycgOiAnbmV3cHJvY2Vzc1NlbGVjdGVkJyxcbiAgICAgICAgJ0luYm94JzogJ2luYm94U2VsZWN0ZWQnLFxuICAgICAgICAnRHJhZnQnIDogJ2RyYWZ0U2VsZWN0ZWQnLFxuICAgICAgICAnUGFydGljaXBhdGVkJyA6ICdwYXJ0aWNpcGF0ZWRTZWxlY3RlZCcsXG4gICAgICAgICdVbmFzc2lnbmVkJyA6ICd1bmFzc2lnbmVkU2VsZWN0ZWQnXG4gICAgfVxuKTsiLCIvKiBvYXV0aC1uZyAtIHYwLjQuMiAtIDIwMTUtMDYtMTkgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBBcHAgbGlicmFyaWVzXG5hbmd1bGFyLm1vZHVsZSgnb2F1dGgnLCBbXG4gICdvYXV0aC5kaXJlY3RpdmUnLCAgICAgIC8vIGxvZ2luIGRpcmVjdGl2ZVxuICAnb2F1dGguYWNjZXNzVG9rZW4nLCAgICAvLyBhY2Nlc3MgdG9rZW4gc2VydmljZVxuICAnb2F1dGguZW5kcG9pbnQnLCAgICAgICAvLyBvYXV0aCBlbmRwb2ludCBzZXJ2aWNlXG4gICdvYXV0aC5wcm9maWxlJywgICAgICAgIC8vIHByb2ZpbGUgbW9kZWxcbiAgJ29hdXRoLnN0b3JhZ2UnLCAgICAgICAgLy8gc3RvcmFnZVxuICAnb2F1dGguaW50ZXJjZXB0b3InICAgICAvLyBiZWFyZXIgdG9rZW4gaW50ZXJjZXB0b3Jcbl0pXG4gIC5jb25maWcoWyckbG9jYXRpb25Qcm92aWRlcicsJyRodHRwUHJvdmlkZXInLFxuICBmdW5jdGlvbigkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlcikge1xuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKS5oYXNoUHJlZml4KCchJyk7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnRXhwaXJlZEludGVyY2VwdG9yJyk7XG4gIH1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYWNjZXNzVG9rZW5TZXJ2aWNlID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmFjY2Vzc1Rva2VuJywgW10pO1xuXG5hY2Nlc3NUb2tlblNlcnZpY2UuZmFjdG9yeSgnQWNjZXNzVG9rZW4nLCBbJ1N0b3JhZ2UnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnJGludGVydmFsJywgZnVuY3Rpb24oU3RvcmFnZSwgJHJvb3RTY29wZSwgJGxvY2F0aW9uLCAkaW50ZXJ2YWwpe1xuXG4gIHZhciBzZXJ2aWNlID0ge1xuICAgIHRva2VuOiBudWxsXG4gIH0sXG4gIG9BdXRoMkhhc2hUb2tlbnMgPSBbIC8vcGVyIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY3NDkjc2VjdGlvbi00LjIuMlxuICAgICdhY2Nlc3NfdG9rZW4nLCAndG9rZW5fdHlwZScsICdleHBpcmVzX2luJywgJ3Njb3BlJywgJ3N0YXRlJyxcbiAgICAnZXJyb3InLCdlcnJvcl9kZXNjcmlwdGlvbidcbiAgXTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWNjZXNzIHRva2VuLlxuICAgKi9cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIGFuZCByZXR1cm5zIHRoZSBhY2Nlc3MgdG9rZW4uIEl0IHRyaWVzIChpbiBvcmRlcikgdGhlIGZvbGxvd2luZyBzdHJhdGVnaWVzOlxuICAgKiAtIHRha2VzIHRoZSB0b2tlbiBmcm9tIHRoZSBmcmFnbWVudCBVUklcbiAgICogLSB0YWtlcyB0aGUgdG9rZW4gZnJvbSB0aGUgc2Vzc2lvblN0b3JhZ2VcbiAgICovXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLnNldFRva2VuRnJvbVN0cmluZygkbG9jYXRpb24uaGFzaCgpKTtcblxuICAgIC8vSWYgaGFzaCBpcyBwcmVzZW50IGluIFVSTCBhbHdheXMgdXNlIGl0LCBjdXogaXRzIGNvbWluZyBmcm9tIG9BdXRoMiBwcm92aWRlciByZWRpcmVjdFxuICAgIGlmKG51bGwgPT09IHNlcnZpY2UudG9rZW4pe1xuICAgICAgc2V0VG9rZW5Gcm9tU2Vzc2lvbigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRva2VuO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIGFjY2VzcyB0b2tlbiBhbmQgcmVtb3ZlIHRoZSBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyB7bnVsbH1cbiAgICovXG4gIHNlcnZpY2UuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgU3RvcmFnZS5kZWxldGUoJ3Rva2VuJyk7XG4gICAgdGhpcy50b2tlbiA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXMudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIFRlbGxzIGlmIHRoZSBhY2Nlc3MgdG9rZW4gaXMgZXhwaXJlZC5cbiAgICovXG4gIHNlcnZpY2UuZXhwaXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnRva2VuICYmIHRoaXMudG9rZW4uZXhwaXJlc19hdCAmJiBuZXcgRGF0ZSh0aGlzLnRva2VuLmV4cGlyZXNfYXQpIDwgbmV3IERhdGUoKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjZXNzIHRva2VuIGZyb20gYSBzdHJpbmcgYW5kIHNhdmUgaXRcbiAgICogQHBhcmFtIGhhc2hcbiAgICovXG4gIHNlcnZpY2Uuc2V0VG9rZW5Gcm9tU3RyaW5nID0gZnVuY3Rpb24oaGFzaCl7XG4gICAgdmFyIHBhcmFtcyA9IGdldFRva2VuRnJvbVN0cmluZyhoYXNoKTtcblxuICAgIGlmKHBhcmFtcyl7XG4gICAgICByZW1vdmVGcmFnbWVudCgpO1xuICAgICAgc2V0VG9rZW4ocGFyYW1zKTtcbiAgICAgIHNldEV4cGlyZXNBdCgpO1xuICAgICAgLy8gV2UgaGF2ZSB0byBzYXZlIGl0IGFnYWluIHRvIG1ha2Ugc3VyZSBleHBpcmVzX2F0IGlzIHNldFxuICAgICAgLy8gIGFuZCB0aGUgZXhwaXJ5IGV2ZW50IGlzIHNldCB1cCBwcm9wZXJseVxuICAgICAgc2V0VG9rZW4odGhpcy50b2tlbik7XG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmxvZ2luJywgc2VydmljZS50b2tlbik7XG4gICAgfVxuICB9O1xuXG4gIC8qICogKiAqICogKiAqICogKiAqXG4gICAqIFBSSVZBVEUgTUVUSE9EUyAqXG4gICAqICogKiAqICogKiAqICogKiAqL1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFjY2VzcyB0b2tlbiBmcm9tIHRoZSBzZXNzaW9uU3RvcmFnZS5cbiAgICovXG4gIHZhciBzZXRUb2tlbkZyb21TZXNzaW9uID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGFyYW1zID0gU3RvcmFnZS5nZXQoJ3Rva2VuJyk7XG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgc2V0VG9rZW4ocGFyYW1zKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYWNjZXNzIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zXG4gICAqIEByZXR1cm5zIHsqfHt9fVxuICAgKi9cbiAgdmFyIHNldFRva2VuID0gZnVuY3Rpb24ocGFyYW1zKXtcbiAgICBzZXJ2aWNlLnRva2VuID0gc2VydmljZS50b2tlbiB8fCB7fTsgICAgICAvLyBpbml0IHRoZSB0b2tlblxuICAgIGFuZ3VsYXIuZXh0ZW5kKHNlcnZpY2UudG9rZW4sIHBhcmFtcyk7ICAgICAgLy8gc2V0IHRoZSBhY2Nlc3MgdG9rZW4gcGFyYW1zXG4gICAgc2V0VG9rZW5JblNlc3Npb24oKTsgICAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgdG9rZW4gaW50byB0aGUgc2Vzc2lvblxuICAgIHNldEV4cGlyZXNBdEV2ZW50KCk7ICAgICAgICAgICAgICAgIC8vIGV2ZW50IHRvIGZpcmUgd2hlbiB0aGUgdG9rZW4gZXhwaXJlc1xuXG4gICAgcmV0dXJuIHNlcnZpY2UudG9rZW47XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBmcmFnbWVudCBVUkkgYW5kIHJldHVybiBhbiBvYmplY3RcbiAgICogQHBhcmFtIGhhc2hcbiAgICogQHJldHVybnMge3t9fVxuICAgKi9cbiAgdmFyIGdldFRva2VuRnJvbVN0cmluZyA9IGZ1bmN0aW9uKGhhc2gpe1xuICAgIHZhciBwYXJhbXMgPSB7fSxcbiAgICAgICAgcmVnZXggPSAvKFteJj1dKyk9KFteJl0qKS9nLFxuICAgICAgICBtO1xuXG4gICAgd2hpbGUgKChtID0gcmVnZXguZXhlYyhoYXNoKSkgIT09IG51bGwpIHtcbiAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQobVsxXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KG1bMl0pO1xuICAgIH1cblxuICAgIGlmKHBhcmFtcy5hY2Nlc3NfdG9rZW4gfHwgcGFyYW1zLmVycm9yKXtcbiAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTYXZlIHRoZSBhY2Nlc3MgdG9rZW4gaW50byB0aGUgc2Vzc2lvblxuICAgKi9cbiAgdmFyIHNldFRva2VuSW5TZXNzaW9uID0gZnVuY3Rpb24oKXtcbiAgICBTdG9yYWdlLnNldCgndG9rZW4nLCBzZXJ2aWNlLnRva2VuKTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSBhY2Nlc3MgdG9rZW4gZXhwaXJhdGlvbiBkYXRlICh1c2VmdWwgZm9yIHJlZnJlc2ggbG9naWNzKVxuICAgKi9cbiAgdmFyIHNldEV4cGlyZXNBdCA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKCFzZXJ2aWNlLnRva2VuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHR5cGVvZihzZXJ2aWNlLnRva2VuLmV4cGlyZXNfaW4pICE9PSAndW5kZWZpbmVkJyAmJiBzZXJ2aWNlLnRva2VuLmV4cGlyZXNfaW4gIT09IG51bGwpIHtcbiAgICAgIHZhciBleHBpcmVzX2F0ID0gbmV3IERhdGUoKTtcbiAgICAgIGV4cGlyZXNfYXQuc2V0U2Vjb25kcyhleHBpcmVzX2F0LmdldFNlY29uZHMoKSArIHBhcnNlSW50KHNlcnZpY2UudG9rZW4uZXhwaXJlc19pbiktNjApOyAvLyA2MCBzZWNvbmRzIGxlc3MgdG8gc2VjdXJlIGJyb3dzZXIgYW5kIHJlc3BvbnNlIGxhdGVuY3lcbiAgICAgIHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCA9IGV4cGlyZXNfYXQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgc2VydmljZS50b2tlbi5leHBpcmVzX2F0ID0gbnVsbDtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogU2V0IHRoZSB0aW1lb3V0IGF0IHdoaWNoIHRoZSBleHBpcmVkIGV2ZW50IGlzIGZpcmVkXG4gICAqL1xuICB2YXIgc2V0RXhwaXJlc0F0RXZlbnQgPSBmdW5jdGlvbigpe1xuICAgIC8vIERvbid0IGJvdGhlciBpZiB0aGVyZSdzIG5vIGV4cGlyZXMgdG9rZW5cbiAgICBpZiAodHlwZW9mKHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCkgPT09ICd1bmRlZmluZWQnIHx8IHNlcnZpY2UudG9rZW4uZXhwaXJlc19hdCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZSA9IChuZXcgRGF0ZShzZXJ2aWNlLnRva2VuLmV4cGlyZXNfYXQpKS0obmV3IERhdGUoKSk7XG4gICAgaWYodGltZSl7XG4gICAgICAkaW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdvYXV0aDpleHBpcmVkJywgc2VydmljZS50b2tlbik7XG4gICAgICB9LCB0aW1lLCAxKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgb0F1dGgyIHBpZWNlcyBmcm9tIHRoZSBoYXNoIGZyYWdtZW50XG4gICAqL1xuICB2YXIgcmVtb3ZlRnJhZ21lbnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjdXJIYXNoID0gJGxvY2F0aW9uLmhhc2goKTtcbiAgICBhbmd1bGFyLmZvckVhY2gob0F1dGgySGFzaFRva2VucyxmdW5jdGlvbihoYXNoS2V5KXtcbiAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoJyYnK2hhc2hLZXkrJyg9W14mXSopP3xeJytoYXNoS2V5KycoPVteJl0qKT8mPycpO1xuICAgICAgY3VySGFzaCA9IGN1ckhhc2gucmVwbGFjZShyZSwnJyk7XG4gICAgfSk7XG5cbiAgICAkbG9jYXRpb24uaGFzaChjdXJIYXNoKTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcblxufV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbmRwb2ludENsaWVudCA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5lbmRwb2ludCcsIFtdKTtcblxuZW5kcG9pbnRDbGllbnQuZmFjdG9yeSgnRW5kcG9pbnQnLCBmdW5jdGlvbigpIHtcblxuICB2YXIgc2VydmljZSA9IHt9O1xuXG4gIC8qXG4gICAqIERlZmluZXMgdGhlIGF1dGhvcml6YXRpb24gVVJMXG4gICAqL1xuXG4gIHNlcnZpY2Uuc2V0ID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbikge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlndXJhdGlvbjtcbiAgICByZXR1cm4gdGhpcy5nZXQoKTtcbiAgfTtcblxuICAvKlxuICAgKiBSZXR1cm5zIHRoZSBhdXRob3JpemF0aW9uIFVSTFxuICAgKi9cblxuICBzZXJ2aWNlLmdldCA9IGZ1bmN0aW9uKCBvdmVycmlkZXMgKSB7XG4gICAgdmFyIHBhcmFtcyA9IGFuZ3VsYXIuZXh0ZW5kKCB7fSwgc2VydmljZS5jb25maWcsIG92ZXJyaWRlcyk7XG4gICAgdmFyIG9BdXRoU2NvcGUgPSAocGFyYW1zLnNjb3BlKSA/IGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMuc2NvcGUpIDogJycsXG4gICAgICAgIHN0YXRlID0gKHBhcmFtcy5zdGF0ZSkgPyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnN0YXRlKSA6ICcnLFxuICAgICAgICBhdXRoUGF0aEhhc1F1ZXJ5ID0gKHBhcmFtcy5hdXRob3JpemVQYXRoLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICBhcHBlbmRDaGFyID0gKGF1dGhQYXRoSGFzUXVlcnkpID8gJyYnIDogJz8nLCAgICAvL2lmIGF1dGhvcml6ZVBhdGggaGFzID8gYWxyZWFkeSBhcHBlbmQgT0F1dGgyIHBhcmFtc1xuICAgICAgICByZXNwb25zZVR5cGUgPSAocGFyYW1zLnJlc3BvbnNlVHlwZSkgPyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLnJlc3BvbnNlVHlwZSkgOiAnJztcblxuICAgIHZhciB1cmwgPSBwYXJhbXMuc2l0ZSArXG4gICAgICAgICAgcGFyYW1zLmF1dGhvcml6ZVBhdGggK1xuICAgICAgICAgIGFwcGVuZENoYXIgKyAncmVzcG9uc2VfdHlwZT0nICsgcmVzcG9uc2VUeXBlICsgJyYnICtcbiAgICAgICAgICAnY2xpZW50X2lkPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zLmNsaWVudElkKSArICcmJyArXG4gICAgICAgICAgJ3JlZGlyZWN0X3VyaT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5yZWRpcmVjdFVyaSkgKyAnJicgK1xuICAgICAgICAgICdzY29wZT0nICsgb0F1dGhTY29wZSArICcmJyArXG4gICAgICAgICAgJ3N0YXRlPScgKyBzdGF0ZTtcblxuICAgIGlmKCBwYXJhbXMubm9uY2UgKSB7XG4gICAgICB1cmwgPSB1cmwgKyAnJm5vbmNlPScgKyBwYXJhbXMubm9uY2U7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH07XG5cbiAgLypcbiAgICogUmVkaXJlY3RzIHRoZSBhcHAgdG8gdGhlIGF1dGhvcml6YXRpb24gVVJMXG4gICAqL1xuXG4gIHNlcnZpY2UucmVkaXJlY3QgPSBmdW5jdGlvbiggb3ZlcnJpZGVzICkge1xuICAgIHZhciB0YXJnZXRMb2NhdGlvbiA9IHRoaXMuZ2V0KCBvdmVycmlkZXMgKTtcbiAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh0YXJnZXRMb2NhdGlvbik7XG4gIH07XG5cbiAgcmV0dXJuIHNlcnZpY2U7XG59KTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHJvZmlsZUNsaWVudCA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5wcm9maWxlJywgW10pO1xuXG5wcm9maWxlQ2xpZW50LmZhY3RvcnkoJ1Byb2ZpbGUnLCBbJyRodHRwJywgJ0FjY2Vzc1Rva2VuJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgQWNjZXNzVG9rZW4sICRyb290U2NvcGUpIHtcbiAgdmFyIHNlcnZpY2UgPSB7fTtcbiAgdmFyIHByb2ZpbGU7XG5cbiAgc2VydmljZS5maW5kID0gZnVuY3Rpb24odXJpKSB7XG4gICAgdmFyIHByb21pc2UgPSAkaHR0cC5nZXQodXJpLCB7IGhlYWRlcnM6IGhlYWRlcnMoKSB9KTtcbiAgICBwcm9taXNlLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcHJvZmlsZSA9IHJlc3BvbnNlO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOnByb2ZpbGUnLCBwcm9maWxlKTtcbiAgICAgIH0pO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9O1xuXG4gIHNlcnZpY2UuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHByb2ZpbGU7XG4gIH07XG5cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbihyZXNvdXJjZSkge1xuICAgIHByb2ZpbGUgPSByZXNvdXJjZTtcbiAgICByZXR1cm4gcHJvZmlsZTtcbiAgfTtcblxuICB2YXIgaGVhZGVycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7IEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIEFjY2Vzc1Rva2VuLmdldCgpLmFjY2Vzc190b2tlbiB9O1xuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdG9yYWdlU2VydmljZSA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5zdG9yYWdlJywgWyduZ1N0b3JhZ2UnXSk7XG5cbnN0b3JhZ2VTZXJ2aWNlLmZhY3RvcnkoJ1N0b3JhZ2UnLCBbJyRyb290U2NvcGUnLCAnJHNlc3Npb25TdG9yYWdlJywgJyRsb2NhbFN0b3JhZ2UnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2Vzc2lvblN0b3JhZ2UsICRsb2NhbFN0b3JhZ2Upe1xuXG4gIHZhciBzZXJ2aWNlID0ge1xuICAgIHN0b3JhZ2U6ICRzZXNzaW9uU3RvcmFnZSAvLyBCeSBkZWZhdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgdGhlIGl0ZW0gZnJvbSBzdG9yYWdlLFxuICAgKiBSZXR1cm5zIHRoZSBpdGVtJ3MgcHJldmlvdXMgdmFsdWVcbiAgICovXG4gIHNlcnZpY2UuZGVsZXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgc3RvcmVkID0gdGhpcy5nZXQobmFtZSk7XG4gICAgZGVsZXRlIHRoaXMuc3RvcmFnZVtuYW1lXTtcbiAgICByZXR1cm4gc3RvcmVkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpdGVtIGZyb20gc3RvcmFnZVxuICAgKi9cbiAgc2VydmljZS5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLnN0b3JhZ2VbbmFtZV07XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGl0ZW0gaW4gc3RvcmFnZSB0byB0aGUgdmFsdWUgc3BlY2lmaWVkXG4gICAqIFJldHVybnMgdGhlIGl0ZW0ncyB2YWx1ZVxuICAgKi9cbiAgc2VydmljZS5zZXQgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLnN0b3JhZ2VbbmFtZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5nZXQobmFtZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgc3RvcmFnZSBzZXJ2aWNlIGJlaW5nIHVzZWRcbiAgICovXG4gIHNlcnZpY2UudXNlID0gZnVuY3Rpb24gKHN0b3JhZ2UpIHtcbiAgICBpZiAoc3RvcmFnZSA9PT0gJ3Nlc3Npb25TdG9yYWdlJykge1xuICAgICAgdGhpcy5zdG9yYWdlID0gJHNlc3Npb25TdG9yYWdlO1xuICAgIH0gZWxzZSBpZiAoc3RvcmFnZSA9PT0gJ2xvY2FsU3RvcmFnZScpIHtcbiAgICAgIHRoaXMuc3RvcmFnZSA9ICRsb2NhbFN0b3JhZ2U7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBzZXJ2aWNlO1xufV0pO1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW50ZXJjZXB0b3JTZXJ2aWNlID0gYW5ndWxhci5tb2R1bGUoJ29hdXRoLmludGVyY2VwdG9yJywgW10pO1xuXG5pbnRlcmNlcHRvclNlcnZpY2UuZmFjdG9yeSgnRXhwaXJlZEludGVyY2VwdG9yJywgWydTdG9yYWdlJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoU3RvcmFnZSwgJHJvb3RTY29wZSkge1xuXG4gIHZhciBzZXJ2aWNlID0ge307XG5cbiAgc2VydmljZS5yZXF1ZXN0ID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIHRva2VuID0gU3RvcmFnZS5nZXQoJ3Rva2VuJyk7XG5cbiAgICBpZiAodG9rZW4gJiYgZXhwaXJlZCh0b2tlbikpIHtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6ZXhwaXJlZCcsIHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnO1xuICB9O1xuXG4gIHZhciBleHBpcmVkID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gKHRva2VuICYmIHRva2VuLmV4cGlyZXNfYXQgJiYgbmV3IERhdGUodG9rZW4uZXhwaXJlc19hdCkgPCBuZXcgRGF0ZSgpKTtcbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcbn1dKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGlyZWN0aXZlcyA9IGFuZ3VsYXIubW9kdWxlKCdvYXV0aC5kaXJlY3RpdmUnLCBbXSk7XG5cbmRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdvYXV0aCcsIFtcbiAgJ0FjY2Vzc1Rva2VuJyxcbiAgJ0VuZHBvaW50JyxcbiAgJ1Byb2ZpbGUnLFxuICAnU3RvcmFnZScsXG4gICckbG9jYXRpb24nLFxuICAnJHJvb3RTY29wZScsXG4gICckY29tcGlsZScsXG4gICckaHR0cCcsXG4gICckdGVtcGxhdGVDYWNoZScsXG4gICdjb25maWdfb2JqZWN0JyxcbiAgZnVuY3Rpb24oQWNjZXNzVG9rZW4sIEVuZHBvaW50LCBQcm9maWxlLCBTdG9yYWdlLCAkbG9jYXRpb24sICRyb290U2NvcGUsICRjb21waWxlLCAkaHR0cCwgJHRlbXBsYXRlQ2FjaGUsIGNvbmZpZ19vYmplY3QpIHtcblxuICAgIHZhciBkZWZpbml0aW9uID0ge1xuICAgICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgc2l0ZTogJ0AnLCAgICAgICAgICAvLyAocmVxdWlyZWQpIHNldCB0aGUgb2F1dGggc2VydmVyIGhvc3QgKGUuZy4gaHR0cDovL29hdXRoLmV4YW1wbGUuY29tKVxuICAgICAgICBjbGllbnRJZDogJ0AnLCAgICAgIC8vIChyZXF1aXJlZCkgY2xpZW50IGlkXG4gICAgICAgIHJlZGlyZWN0VXJpOiAnQCcsICAgLy8gKHJlcXVpcmVkKSBjbGllbnQgcmVkaXJlY3QgdXJpXG4gICAgICAgIHJlc3BvbnNlVHlwZTogJ0AnLCAgLy8gKG9wdGlvbmFsKSByZXNwb25zZSB0eXBlLCBkZWZhdWx0cyB0byB0b2tlbiAodXNlICd0b2tlbicgZm9yIGltcGxpY2l0IGZsb3cgYW5kICdjb2RlJyBmb3IgYXV0aG9yaXphdGlvbiBjb2RlIGZsb3dcbiAgICAgICAgc2NvcGU6ICdAJywgICAgICAgICAvLyAob3B0aW9uYWwpIHNjb3BlXG4gICAgICAgIHByb2ZpbGVVcmk6ICdAJywgICAgLy8gKG9wdGlvbmFsKSB1c2VyIHByb2ZpbGUgdXJpIChlLmcgaHR0cDovL2V4YW1wbGUuY29tL21lKVxuICAgICAgICB0ZW1wbGF0ZTogJ0AnLCAgICAgIC8vIChvcHRpb25hbCkgdGVtcGxhdGUgdG8gcmVuZGVyIChlLmcgYm93ZXJfY29tcG9uZW50cy9vYXV0aC1uZy9kaXN0L3ZpZXdzL3RlbXBsYXRlcy9kZWZhdWx0Lmh0bWwpXG4gICAgICAgIHRleHQ6ICdAJywgICAgICAgICAgLy8gKG9wdGlvbmFsKSBsb2dpbiB0ZXh0XG4gICAgICAgIGF1dGhvcml6ZVBhdGg6ICdAJywgLy8gKG9wdGlvbmFsKSBhdXRob3JpemF0aW9uIHVybFxuICAgICAgICBzdGF0ZTogJ0AnLCAgICAgICAgIC8vIChvcHRpb25hbCkgQW4gYXJiaXRyYXJ5IHVuaXF1ZSBzdHJpbmcgY3JlYXRlZCBieSB5b3VyIGFwcCB0byBndWFyZCBhZ2FpbnN0IENyb3NzLXNpdGUgUmVxdWVzdCBGb3JnZXJ5XG4gICAgICAgIHN0b3JhZ2U6ICdAJyAgICAgICAgLy8gKG9wdGlvbmFsKSBTdG9yZSB0b2tlbiBpbiAnc2Vzc2lvblN0b3JhZ2UnIG9yICdsb2NhbFN0b3JhZ2UnLCBkZWZhdWx0cyB0byAnc2Vzc2lvblN0b3JhZ2UnXG4gICAgICB9XG4gICAgfTtcblxuICAgIGRlZmluaXRpb24ubGluayA9IGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICBzY29wZS5zaG93ID0gJ25vbmUnO1xuXG4gICAgICBzY29wZS4kd2F0Y2goJ2NsaWVudElkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGluaXQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpbml0QXR0cmlidXRlcygpOyAgICAgICAgICAvLyBzZXRzIGRlZmF1bHRzXG4gICAgICAgIFN0b3JhZ2UudXNlKHNjb3BlLnN0b3JhZ2UpOy8vIHNldCBzdG9yYWdlXG4gICAgICAgIGNvbXBpbGUoKTsgICAgICAgICAgICAgICAgIC8vIGNvbXBpbGVzIHRoZSBkZXNpcmVkIGxheW91dFxuICAgICAgICBFbmRwb2ludC5zZXQoc2NvcGUpOyAgICAgICAvLyBzZXRzIHRoZSBvYXV0aCBhdXRob3JpemF0aW9uIHVybFxuICAgICAgICBBY2Nlc3NUb2tlbi5zZXQoc2NvcGUpOyAgICAvLyBzZXRzIHRoZSBhY2Nlc3MgdG9rZW4gb2JqZWN0IChpZiBleGlzdGluZywgZnJvbSBmcmFnbWVudCBvciBzZXNzaW9uKVxuICAgICAgICBpbml0UHJvZmlsZShzY29wZSk7ICAgICAgICAvLyBnZXRzIHRoZSBwcm9maWxlIHJlc291cmNlIChpZiBleGlzdGluZyB0aGUgYWNjZXNzIHRva2VuKVxuICAgICAgICBpbml0VmlldygpOyAgICAgICAgICAgICAgICAvLyBzZXRzIHRoZSB2aWV3IChsb2dnZWQgaW4gb3Igb3V0KVxuICAgICAgfTtcblxuICAgICAgdmFyIGluaXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNjb3BlLmF1dGhvcml6ZVBhdGggPSBzY29wZS5hdXRob3JpemVQYXRoIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLmF1dGhvcml6ZVBhdGg7XG4gICAgICAgIHNjb3BlLnRva2VuUGF0aCAgICAgPSBzY29wZS50b2tlblBhdGggICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnRva2VuUGF0aDtcbiAgICAgICAgc2NvcGUudGVtcGxhdGUgICAgICA9IHNjb3BlLnRlbXBsYXRlICAgICAgfHwgJ3ZpZXdzL3RlbXBsYXRlcy9idXR0b24uaHRtbCc7XG4gICAgICAgIHNjb3BlLnJlc3BvbnNlVHlwZSAgPSBzY29wZS5yZXNwb25zZVR5cGUgIHx8ICd0b2tlbic7XG4gICAgICAgIHNjb3BlLnRleHQgICAgICAgICAgPSBzY29wZS50ZXh0ICAgICAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnRleHQ7XG4gICAgICAgIHNjb3BlLnN0YXRlICAgICAgICAgPSBzY29wZS5zdGF0ZSAgICAgICAgIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgc2NvcGUuc2NvcGUgICAgICAgICA9IHNjb3BlLnNjb3BlICAgICAgICAgfHwgY29uZmlnX29iamVjdC5vYXV0aF9idXR0b24uc2NvcGU7XG4gICAgICAgIHNjb3BlLnN0b3JhZ2UgICAgICAgPSBzY29wZS5zdG9yYWdlICAgICAgIHx8ICdzZXNzaW9uU3RvcmFnZSc7XG4gICAgICAgIHNjb3BlLnNpdGUgICAgICAgICAgPSBzY29wZS5zaXRlICAgICAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLnNpdGU7XG4gICAgICAgIHNjb3BlLmNsaWVudElkICAgICAgPSBzY29wZS5jbGllbnRJZCAgICAgIHx8IGNvbmZpZ19vYmplY3Qub2F1dGhfYnV0dG9uLmNsaWVudElkO1xuICAgICAgICBzY29wZS5yZWRpcmVjdFVyaSAgID0gc2NvcGUucmVkaXJlY3RVcmkgICB8fCBjb25maWdfb2JqZWN0Lm9hdXRoX2J1dHRvbi5yZWRpcmVjdFVyaTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjb21waWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRodHRwLmdldChzY29wZS50ZW1wbGF0ZSwgeyBjYWNoZTogJHRlbXBsYXRlQ2FjaGUgfSkuc3VjY2VzcyhmdW5jdGlvbihodG1sKSB7XG4gICAgICAgICAgZWxlbWVudC5odG1sKGh0bWwpO1xuICAgICAgICAgICRjb21waWxlKGVsZW1lbnQuY29udGVudHMoKSkoc2NvcGUpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBpbml0UHJvZmlsZSA9IGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IEFjY2Vzc1Rva2VuLmdldCgpO1xuXG4gICAgICAgIGlmICh0b2tlbiAmJiB0b2tlbi5hY2Nlc3NfdG9rZW4gJiYgc2NvcGUucHJvZmlsZVVyaSkge1xuICAgICAgICAgIFByb2ZpbGUuZmluZChzY29wZS5wcm9maWxlVXJpKS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzY29wZS5wcm9maWxlID0gcmVzcG9uc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBpbml0VmlldyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBBY2Nlc3NUb2tlbi5nZXQoKTtcblxuICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgcmV0dXJuIGxvZ2dlZE91dCgpOyAvLyB3aXRob3V0IGFjY2VzcyB0b2tlbiBpdCdzIGxvZ2dlZCBvdXRcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4uYWNjZXNzX3Rva2VuKSB7XG4gICAgICAgICAgcmV0dXJuIGF1dGhvcml6ZWQoKTsgLy8gaWYgdGhlcmUgaXMgdGhlIGFjY2VzcyB0b2tlbiB3ZSBhcmUgZG9uZVxuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbi5lcnJvcikge1xuICAgICAgICAgIHJldHVybiBkZW5pZWQoKTsgLy8gaWYgdGhlIHJlcXVlc3QgaGFzIGJlZW4gZGVuaWVkIHdlIGZpcmUgdGhlIGRlbmllZCBldmVudFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBFbmRwb2ludC5yZWRpcmVjdCgpO1xuICAgICAgfTtcblxuICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koc2NvcGUpO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ29hdXRoOmxvZ291dCcpO1xuICAgICAgICBsb2dnZWRPdXQoKTtcbiAgICAgIH07XG5cbiAgICAgIHNjb3BlLiRvbignb2F1dGg6ZXhwaXJlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBBY2Nlc3NUb2tlbi5kZXN0cm95KHNjb3BlKTtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdsb2dnZWQtb3V0JztcbiAgICAgIH0pO1xuXG4gICAgICAvLyB1c2VyIGlzIGF1dGhvcml6ZWRcbiAgICAgIHZhciBhdXRob3JpemVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6YXV0aG9yaXplZCcsIEFjY2Vzc1Rva2VuLmdldCgpKTtcbiAgICAgICAgc2NvcGUuc2hvdyA9ICdsb2dnZWQtaW4nO1xuICAgICAgfTtcblxuICAgICAgLy8gc2V0IHRoZSBvYXV0aCBkaXJlY3RpdmUgdG8gdGhlIGxvZ2dlZC1vdXQgc3RhdHVzXG4gICAgICB2YXIgbG9nZ2VkT3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6bG9nZ2VkT3V0Jyk7XG4gICAgICAgIHNjb3BlLnNob3cgPSAnbG9nZ2VkLW91dCc7XG4gICAgICB9O1xuXG4gICAgICAvLyBzZXQgdGhlIG9hdXRoIGRpcmVjdGl2ZSB0byB0aGUgZGVuaWVkIHN0YXR1c1xuICAgICAgdmFyIGRlbmllZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzY29wZS5zaG93ID0gJ2RlbmllZCc7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnb2F1dGg6ZGVuaWVkJyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBVcGRhdGVzIHRoZSB0ZW1wbGF0ZSBhdCBydW50aW1lXG4gICAgICBzY29wZS4kb24oJ29hdXRoOnRlbXBsYXRlOnVwZGF0ZScsIGZ1bmN0aW9uKGV2ZW50LCB0ZW1wbGF0ZSkge1xuICAgICAgICBzY29wZS50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICBjb21waWxlKHNjb3BlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBIYWNrIHRvIHVwZGF0ZSB0aGUgZGlyZWN0aXZlIGNvbnRlbnQgb24gbG9nb3V0XG4gICAgICAvLyBUT0RPIHRoaW5rIHRvIGEgY2xlYW5lciBzb2x1dGlvblxuICAgICAgc2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpbml0KCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmluaXRpb247XG4gIH1cbl0pO1xuIiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMzEvMTRcbiAqIEBuYW1lIEFQSVxuICogQGRlc2MgQVBJIFNlcnZpY2UgZm9yIGNvbm5lY3RpbmcgdG8gdGhlIFByb2Nlc3NNYWtlciAzLjAgUkVTVCBBUElcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLy9TZXJ2aWNlIHRvIG1ha2UgQVBJIGNhbGxzIHRvIHRoZSBSRVNUIEFQSVxuLy9XZSBhcmUgcGFzc2luZyAkaHR0cCB0byBtYWtlIGFqYXggcmVxdWVzdHMgYW5kIHRoZSB1cmwgZm9yIHRoZSBSRVNUIEFQSVxuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpLlxuc2VydmljZSgnQVBJJywgZnVuY3Rpb24oJGh0dHAsIGFwaV91cmwpe1xuICAgIC8vV2UgYXJlIGRlZmluaW5nIHRoZSByZXF1ZXN0VHlwZSwgdGhpcyBpcyB0aGUgc3BlY2lmaWMgZW5kcG9pbnQgb2YgdGhlIFJFU1QgQVBJIHdlIGFyZSByZXF1ZXN0aW5nXG4gICAgLy9QYXJhbXMgYXJlIGFueSBwYXJhbWV0ZXJzIHRoYXQgd2UgYXJlIHBhc3NpbmcgYXMgcGFydCBvZiBhIHBvc3QvcHV0IHJlcXVlc3RcbiAgICB2YXIgcmVxdWVzdFR5cGUsIHBhcmFtcztcbiAgICAvL0RlZmluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgc2VydmljZVxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgZ2V0UmVxdWVzdFR5cGVcbiAgICAgICAgICogQGRlc2MgR2V0IG1ldGhvZCBmb3IgZ2V0dGluZyB0aGUgY3VycmVudCByZXF1ZXN0IHR5cGVcbiAgICAgICAgICogQHJldHVybnMgeyp9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRSZXF1ZXN0VHlwZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RUeXBlO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIHNldFJlcXVlc3RUeXBlXG4gICAgICAgICAqIEBkZXNjIFNldCBtZXRob2QgZm9yIHNldHRpbmcgdGhlIGN1cnJlbnQgcmVxdWVzdCB0eXBlXG4gICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0UmVxdWVzdFR5cGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICByZXF1ZXN0VHlwZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIGdldFBhcmFtc1xuICAgICAgICAgKiBAZGVzYyBHZXQgbWV0aG9kIGZvciBnZXR0aW5nIHRoZSBjdXJyZW50IHBhcmFtc1xuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICovXG4gICAgICAgIGdldFBhcmFtczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzZXRQYXJhbXNcbiAgICAgICAgICogQGRlc2MgU2V0IG1ldGhvZCBmb3Igc2V0dGluZyB0aGUgY3VycmVudCBwYXJhbXNcbiAgICAgICAgICogQHBhcmFtIHZhbHVlXG4gICAgICAgICAqL1xuICAgICAgICBzZXRQYXJhbXM6IGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgICAgIHBhcmFtcyA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICpcbiAgICAgICAgICogQG5hbWUgc2V0UGFyYW1zXG4gICAgICAgICAqIEBkZXNjIFRoaXMgaXMgdGhlIG1haW4gZnVuY3Rpb24gb2YgdGhlIHNlcnZpY2UuIEl0IG1ha2VzIGEgY2FsbCB0byB0aGUgUkVTVCBBUElcbiAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrIC0gcmVxdWlyZWRcbiAgICAgICAgICogQHBhcmFtIHJlcXVlc3RUeXBlIC0gb3B0aW9uYWxcbiAgICAgICAgICogQHBhcmFtIG1ldGhvZCAtIG9wdGlvbmFsXG4gICAgICAgICAqL1xuICAgICAgICBjYWxsOiBmdW5jdGlvbihjYWxsYmFjaywgbWV0aG9kLCByZXF1ZXN0VHlwZSl7XG5cbiAgICAgICAgICAgIC8vRGVmaW5lIG9wdGlvbmFsIHBhcmFtcyBzbyB0aGF0IG9ubHkgY2FsbGJhY2sgbmVlZHMgdG8gYmUgc3BlY2lmaWVkIHdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAgICAgICAgICAgIC8vQXNzaWduIGRlZmF1bHQgdmFsdWUgb2cgR0VUIHRvIHRoZSBtZXRob2QgdGhhdCB3ZSBhcmUgcmVxdWVzdGluZ1xuXG4gICAgICAgICAgICBpZiggdHlwZW9mICggbWV0aG9kICkgPT09ICd1bmRlZmluZWQnKSBtZXRob2QgPSAnR0VUJztcblxuICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHJlcXVlc3QgdHlwZSB0byB0aGUgZ2V0dGVyIG1ldGhvZC5cbiAgICAgICAgICAgIC8vVGhpcyBpcyB0aGUgd2F5IHRvIHVzZSB0aGUgc2VydmljZS4gU2V0IHRoZSBzZXRSZXF1ZXN0VHlwZSB0byB0aGUgdXJsIGVuZHBvaW50IHlvdSB3YW50IHRvIGhpdFxuICAgICAgICAgICAgLy9Gb3IgZXhhbXBsZSwgaWYgeW91IHdhbnQgYSBsaXN0IG9mIHByb2plY3RzL3Byb2Nlc3MsIGluIHlvdXIgY29udHJvbGxlciBkbyB0aGlzIGJlZm9yZSB5b3UgY2FsbCB0aGlzIG1ldGhvZDpcbiAgICAgICAgICAgIC8vQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0cycpO1xuXG4gICAgICAgICAgICBpZiggdHlwZW9mICggcmVxdWVzdFR5cGUgKSA9PT0gJ3VuZGVmaW5lZCcpIHJlcXVlc3RUeXBlID0gdGhpcy5nZXRSZXF1ZXN0VHlwZSgpO1xuXG4gICAgICAgICAgICAvL0hhbmRsZSBpZiB0aGVyZSB3YXMgbm8gcmVxdWVzdCB0eXBlIGRlZmluZWRcblxuICAgICAgICAgICAgaWYoIHR5cGVvZiAoIHJlcXVlc3RUeXBlICkgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gJ0ludmFsaWQgcmVxdWVzdFR5cGUgb3Igbm8gcmVxdWVzdFR5cGUgZGVmaW5lZC4nO1xuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgIFN3aXRjaCBiYXNlZCBvbiBtZXRob2QgdHlwZSBpbiBvcmRlciB0byByZXF1ZXN0IHRoZSByaWdodCB0eXBlIG9mIGFwaVxuICAgICAgICAgICAgIERlZmF1bHQgaXMgdGhlIEdFVCBtZXRob2QsIGJlY2F1c2UgdGhpcyBpcyB0aGUgbW9zdCBjb21tb24gbWV0aG9kIHVzZWRcbiAgICAgICAgICAgICBDb252ZXJ0IHRoZSBtZXRob2QgdG8gdXBwZXIgY2FzZSBmb3IgY29uc2lzdGVuY3lcblxuICAgICAgICAgICAgIEZpcnN0LCB3ZSBtYWtlIHRoZSBhcHByb3ByaWF0ZSBhamF4IGNhbGwgd2l0aCB0aGUgcmVsZXZhbnQgZW5kIHBvaW50IGF0dGFjaGVkIHRvIGl0XG4gICAgICAgICAgICAgVGhlbiwgd2UgY2hlY2sgaWYgYSBjYWxsYmFjayBpcyBkZWZpbmVkLCBpZiBzbywgd2UgcnVuIGl0IHdoaWxlIHBhc3NpbmcgdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICAgZnJvbSB0aGUgc2VydmVyIHRvIGl0LlxuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIHN3aXRjaChtZXRob2QudG9VcHBlckNhc2UoKSl7XG4gICAgICAgICAgICAgICAgY2FzZSAnR0VUJzpcbiAgICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KGFwaV91cmwrcmVxdWVzdFR5cGUpLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdQT1NUJzpcbiAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChhcGlfdXJsK3JlcXVlc3RUeXBlLCBwYXJhbXMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdQVVQnOlxuICAgICAgICAgICAgICAgICAgICAkaHR0cC5wdXQoYXBpX3VybCtyZXF1ZXN0VHlwZSwgcGFyYW1zKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrKSBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgb3Igbm8gbWV0aG9kIGRlZmluZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzMxLzE0XG4gKiBAbmFtZSBuZ3N0b3JhZ2VcbiAqIEBkZXNjXG4gKi9cbid1c2Ugc3RyaWN0Jztcbi8qanNoaW50IC1XMDMwICovXG5cbihmdW5jdGlvbigpIHtcblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBvdmVydmlld1xuICAgICAqIEBuYW1lIG5nU3RvcmFnZVxuICAgICAqL1xuXG4gICAgYW5ndWxhci5tb2R1bGUoJ25nU3RvcmFnZScsIFtdKS5cblxuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBvYmplY3RcbiAgICAgKiBAbmFtZSBuZ1N0b3JhZ2UuJGxvY2FsU3RvcmFnZVxuICAgICAqIEByZXF1aXJlcyAkcm9vdFNjb3BlXG4gICAgICogQHJlcXVpcmVzICR3aW5kb3dcbiAgICAgKi9cblxuICAgICAgICBmYWN0b3J5KCckbG9jYWxTdG9yYWdlJywgX3N0b3JhZ2VGYWN0b3J5KCdsb2NhbFN0b3JhZ2UnKSkuXG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2Mgb2JqZWN0XG4gICAgICogQG5hbWUgbmdTdG9yYWdlLiRzZXNzaW9uU3RvcmFnZVxuICAgICAqIEByZXF1aXJlcyAkcm9vdFNjb3BlXG4gICAgICogQHJlcXVpcmVzICR3aW5kb3dcbiAgICAgKi9cblxuICAgICAgICBmYWN0b3J5KCckc2Vzc2lvblN0b3JhZ2UnLCBfc3RvcmFnZUZhY3RvcnkoJ3Nlc3Npb25TdG9yYWdlJykpO1xuXG4gICAgZnVuY3Rpb24gX3N0b3JhZ2VGYWN0b3J5KHN0b3JhZ2VUeXBlKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAnJHJvb3RTY29wZScsXG4gICAgICAgICAgICAnJHdpbmRvdycsXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uKFxuICAgICAgICAgICAgICAgICRyb290U2NvcGUsXG4gICAgICAgICAgICAgICAgJHdpbmRvd1xuICAgICAgICAgICAgICAgICl7XG4gICAgICAgICAgICAgICAgLy8gIzk6IEFzc2lnbiBhIHBsYWNlaG9sZGVyIG9iamVjdCBpZiBXZWIgU3RvcmFnZSBpcyB1bmF2YWlsYWJsZSB0byBwcmV2ZW50IGJyZWFraW5nIHRoZSBlbnRpcmUgQW5ndWxhckpTIGFwcFxuICAgICAgICAgICAgICAgIHZhciB3ZWJTdG9yYWdlID0gJHdpbmRvd1tzdG9yYWdlVHlwZV0gfHwgKGNvbnNvbGUud2FybignVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgV2ViIFN0b3JhZ2UhJyksIHt9KSxcbiAgICAgICAgICAgICAgICAgICAgJHN0b3JhZ2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZGVmYXVsdDogZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuaXNEZWZpbmVkKCRzdG9yYWdlW2tdKSB8fCAoJHN0b3JhZ2Vba10gPSBpdGVtc1trXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzdG9yYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICRyZXNldDogZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluICRzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckJyA9PT0ga1swXSB8fCBkZWxldGUgJHN0b3JhZ2Vba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzdG9yYWdlLiRkZWZhdWx0KGl0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgX2xhc3Qkc3RvcmFnZSxcbiAgICAgICAgICAgICAgICAgICAgX2RlYm91bmNlO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGs7IGkgPCB3ZWJTdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICM4LCAjMTA6IGB3ZWJTdG9yYWdlLmtleShpKWAgbWF5IGJlIGFuIGVtcHR5IHN0cmluZyAob3IgdGhyb3cgYW4gZXhjZXB0aW9uIGluIElFOSBpZiBgd2ViU3RvcmFnZWAgaXMgZW1wdHkpXG4gICAgICAgICAgICAgICAgICAgIChrID0gd2ViU3RvcmFnZS5rZXkoaSkpICYmICduZ1N0b3JhZ2UtJyA9PT0gay5zbGljZSgwLCAxMCkgJiYgKCRzdG9yYWdlW2suc2xpY2UoMTApXSA9IGFuZ3VsYXIuZnJvbUpzb24od2ViU3RvcmFnZS5nZXRJdGVtKGspKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX2xhc3Qkc3RvcmFnZSA9IGFuZ3VsYXIuY29weSgkc3RvcmFnZSk7XG5cbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgX2RlYm91bmNlIHx8IChfZGVib3VuY2UgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2RlYm91bmNlID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVxdWFscygkc3RvcmFnZSwgX2xhc3Qkc3RvcmFnZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goJHN0b3JhZ2UsIGZ1bmN0aW9uKHYsIGspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5pc0RlZmluZWQodikgJiYgJyQnICE9PSBrWzBdICYmIHdlYlN0b3JhZ2Uuc2V0SXRlbSgnbmdTdG9yYWdlLScgKyBrLCBhbmd1bGFyLnRvSnNvbih2KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIF9sYXN0JHN0b3JhZ2Vba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIF9sYXN0JHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2ViU3RvcmFnZS5yZW1vdmVJdGVtKCduZ1N0b3JhZ2UtJyArIGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9sYXN0JHN0b3JhZ2UgPSBhbmd1bGFyLmNvcHkoJHN0b3JhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAxMDApKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vICM2OiBVc2UgYCR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcmAgaW5zdGVhZCBvZiBgYW5ndWxhci5lbGVtZW50YCB0byBhdm9pZCB0aGUgalF1ZXJ5LXNwZWNpZmljIGBldmVudC5vcmlnaW5hbEV2ZW50YFxuICAgICAgICAgICAgICAgICdsb2NhbFN0b3JhZ2UnID09PSBzdG9yYWdlVHlwZSAmJiAkd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJiYgJHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCduZ1N0b3JhZ2UtJyA9PT0gZXZlbnQua2V5LnNsaWNlKDAsIDEwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQubmV3VmFsdWUgPyAkc3RvcmFnZVtldmVudC5rZXkuc2xpY2UoMTApXSA9IGFuZ3VsYXIuZnJvbUpzb24oZXZlbnQubmV3VmFsdWUpIDogZGVsZXRlICRzdG9yYWdlW2V2ZW50LmtleS5zbGljZSgxMCldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBfbGFzdCRzdG9yYWdlID0gYW5ndWxhci5jb3B5KCRzdG9yYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuICRzdG9yYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxufSkoKTtcbiIsIi8qKlxuLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDgvMzEvMjAxNVxuICogQG5hbWUgQXV0aG9yaXplZEN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIEhvbWUgcGFnZVxuICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdBdXRob3JpemVkQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhbFN0b3JhZ2Upe1xuICAgIC8vQ2hlY2sgaWYgbG9jYWxTdG9yYWdlIGhhcyBhIG1lc3NhZ2UgdG8gZGlzcGxheVxuICAgIGlmICggJGxvY2FsU3RvcmFnZS5tZXNzYWdlICl7XG4gICAgICAgIC8vU2V0IHRoZSBuZXdNZXNzYWdlIHRvIHRydWUgc28gdGhhdCBpdCB3aWxsIHNob3cgb24gdGhlIGhvbWUgcGFnZVxuICAgICAgICAkc2NvcGUubmV3TWVzc2FnZSA9IHRydWU7XG4gICAgICAgIC8vU2V0IHRoZSBtZXNzYWdlIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlIGNhbiByZW5kZXIgaXQgaW4gdGhlIHZpZXdcbiAgICAgICAgJHNjb3BlLldlbGNvbWVNZXNzYWdlID0gJGxvY2FsU3RvcmFnZS5tZXNzYWdlO1xuICAgIH1lbHNle1xuICAgICAgICAvL05vIG1lc3NhZ2UgaW4gdGhlIGxvY2FsU3RvcmFnZSwgc28gc2V0IG5ld01lc3NhZ2UgdG8gZmFsc2VcbiAgICAgICAgJHNjb3BlLm5ld01lc3NhZ2UgPSBmYWxzZTtcbiAgICAgICAgLy9EaXNwbGF5IHRoZSBkZWZhdWx0IG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLldlbGNvbWVNZXNzYWdlID0gJyQkV2VsY29tZU1lc3NhZ2UkJCc7XG4gICAgfVxuICAgIC8vRGVzdG9yeSB0aGUgbWVzc2FnZSBpbiB0aGUgbG9jYWxTdG9yYWdlIG5vdyB0aGF0IHdlIGhhdmUgZGlzcGxheWVkIGl0IGluIHRoZSBzY29wZVxuICAgICRsb2NhbFN0b3JhZ2UubWVzc2FnZSA9IG51bGw7XG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgRHJhZnRDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBEcmFmdCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdEcmFmdEN0cmwnLCBmdW5jdGlvbiAoQVBJLCAkc2NvcGUpe1xuICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvZHJhZnQnKTtcbiAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBjYXNlcyBpbiBkcmFmdCBzdGF0dXNcbiAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAvLyNjYXNlcy10YWJsZSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAvL1RoZSBsaXN0IG9mIGNhc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUb2RvIGNyZWF0ZSBzb21lIHR5cGUgb2YgZGlyZWN0aXZlL3NlcnZpY2UgdG8gcmVuZGVyIG1lc3NhZ2VzIGluIHRoZSBhcHBsaWNhdGlvbiB3aXRoIGp1c3QgYSBxdWljayBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICQoJyNjYXNlcy10YWJsZScpLmh0bWwoXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1pbmZvXCI+JytcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JytcbiAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1vayBibHVlXCI+PC9pPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJytcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgRHluYWZvcm1DdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBEeW5hZm9ybVxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdEeW5hZm9ybUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYXRpb24sICRsb2NhbFN0b3JhZ2UsIEFQSSkge1xuXG4gICAgICAgIC8vSW5zdGFudGlhdGUgdGhlIGR5bmFmb3JtIG9iamVjdCBzbyB0aGF0IHdlIGNhbiBhc3NpZ24gcHJvcGVydGllcyB0byBpdFxuICAgICAgICAkc2NvcGUuZHluYWZvcm0gPSB7fTtcbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgncHJvamVjdC8nKyRsb2NhbFN0b3JhZ2UucHJvX3VpZCsnL2FjdGl2aXR5LycrJGxvY2FsU3RvcmFnZS5hY3RfdWlkKycvc3RlcHMnKTtcbiAgICAgICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2Ygc3RlcHNcbiAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgLy9HZXQgdGhlIGZpcnN0IG9iamVjdC9mb3JtIGZvciB0aGUgZGVtbyBhcHBsaWNhdGlvblxuICAgICAgICAgICAgLy9JbiBhIHJlYWwgd29ybGQgZXhhbXBsZSB5b3Ugd291bGQgaGF2ZSB0byBidWlsZCBsb2dpYyBhdCB0aGlzIHBvaW50IHRvXG4gICAgICAgICAgICAvL0Rpc3BsYXkgdGhlIGFwcHJvcHJpYXRlIHN0ZXBzXG4gICAgICAgICAgICAvL0Fzc2lnbiB0aGUgZHluYWZvcm0gdWlkIC8gc3RlcCB1aWQgdG8gbG9jYWxTdG9yYWdlIGZvciBwZXJzaXN0ZW5jZVxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5zdGVwX3VpZF9vYmogPSByZXNwb25zZS5kYXRhWzBdLnN0ZXBfdWlkX29iajtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0LycrJGxvY2FsU3RvcmFnZS5wcm9fdWlkKycvZHluYWZvcm0vJyskbG9jYWxTdG9yYWdlLnN0ZXBfdWlkX29iaik7XG4gICAgICAgICAgICAvL01ha2UgYSBjYWxsIHRvIHRoZSBBUEkgcmVxdWVzdGluZyBkeW5hZm9ybSBkZWZpbml0aW9uIGluIG9yZGVyIHRvIHJlbmRlciB0aGUgZm9ybVxuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHZhciBkeW5hZm9ybUNvbnRlbnQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmRhdGEuZHluX2NvbnRlbnQpO1xuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZHluX3VpZCA9IHJlc3BvbnNlLmRhdGEuZHluX3VpZDtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0ubWFpblRpdGxlID0gcmVzcG9uc2UuZGF0YS5keW5fdGl0bGU7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkcyA9IGR5bmFmb3JtQ29udGVudC5pdGVtc1swXS5pdGVtcztcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0uYXBwX251bWJlciA9ICRsb2NhbFN0b3JhZ2UuYXBwX251bWJlcjtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZHluYWZvcm0uZmllbGRzID0gZmllbGRzO1xuICAgICAgICAgICAgICAgICRzY29wZS5keW5hZm9ybS5zdWJtaXQgPSBmaWVsZHNbZmllbGRzLmxlbmd0aC0xXVswXTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZENhc2VEYXRhKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAgICAgICAgICogQG5hbWUgc3VibWl0Q2FzZVxuICAgICAgICAgKiBAZGVzYyBTdWJtaXRzIHRoZSBmb3JtIHRvIFByb2Nlc3NNYWtlciB0byBzYXZlIHRoZSBkYXRhIGFuZCB0YWtlcyB0aGUgdXNlciBiYWNrIHRvIHRoZWlyIGluYm94XG4gICAgICAgICAqL1xuXG4gICAgICAgICRzY29wZS5zdWJtaXRDYXNlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSBkZWxlZ2F0aW9uIGluZGV4IGVxdWFsIHRvIDEgaWYgdGhlcmUgaXMgbm8gZGVsZWdhdGlvbiBpbmRleCwgdGhpcyB3b3VsZCBtZWFuIHRoYXQgdGhlIGNhc2UgaXNcbiAgICAgICAgICAgIC8vQ3VycmVudGx5IGluIGRyYWZ0IHN0YXR1cywgb3RoZXJ3aXNlLCBpZiB0aGUgZGVsZWdhdGlvbiBpcyBub3QgbnVsbCwganVzdCBhc3NpZ24gaXQgdmFsdWUgb2YgdGhlIGRlbGVnYXRpb25cbiAgICAgICAgICAgIC8vaW5kZXhcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSAoJGxvY2FsU3RvcmFnZS5kZWxJbmRleCA9PT0gbnVsbCkgPyAxIDogJGxvY2FsU3RvcmFnZS5kZWxJbmRleDtcbiAgICAgICAgICAgIC8vSW5zdGFudGlhdGUgYW4gb2JqZWN0IGluIG9yZGVyIHRvIHVzZSB0byBjcmVhdGUgdGhlIG9iamVjdCB0aGF0IHdlIHdpbGwgYmUgc2VuZGluZyB0byBQcm9jZXNzTWFrZXJcbiAgICAgICAgICAgIC8vSW4gdGhlIC5lYWNoIGxvb3BcbiAgICAgICAgICAgIHZhciBkYXRhT2JqID0ge307XG4gICAgICAgICAgICAvL0hlcmUgd2UgZ2V0IGFsbCB0aGUgaW5wdXQgZWxlbWVudHMgb24gdGhlIGZvcm0gYW5kIHB1dCB0aGVtIGludG8gdGhlIG9iamVjdCBjcmVhdGVkIGFib3ZlXG4gICAgICAgICAgICAvL1RvRG8gc3VwcG9ydCBmb3Igb3RoZXIgZWxlbWVudHMgYmVzaWRlcyBpbnB1dCBlLmcuIHNlbGVjdCwgdGV4dGFyZWEsIHJhZGlvLCBjaGVja1xuICAgICAgICAgICAgJCgnZm9ybScpLmZpbmQoJzppbnB1dCcpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAvL1dlIGZpcnN0IGNoZWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBmaWVsZCBoYXMgYSBwcm9wZXIgaWRcbiAgICAgICAgICAgICAgICAvL1RoZW4gd2UgYXNzaWduIHRvIHRoZSBvYmplY3QgYSBrZXkgb2YgdGhlIGZpZWxkIGlkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaWVsZFxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mKCQodGhpcykuYXR0cignaWQnKSkgIT09ICd1bmRlZmluZWQnICkgZGF0YU9ialskKHRoaXMpLmF0dHIoJ2lkJyldID0gJCh0aGlzKS52YWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrJGxvY2FsU3RvcmFnZS5hcHBfdWlkKycvdmFyaWFibGUnKTtcbiAgICAgICAgICAgIC8vU2V0IHRoZSBwYXJhbXMgZm9yIHRoZSBwdXQgcmVxdWVzdFxuICAgICAgICAgICAgQVBJLnNldFBhcmFtcyhkYXRhT2JqKTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSB0byBzdWJtaXQgdGhlIGRhdGEgdG8gYmUgc2F2ZWQgdG8gdGhlIGNhc2VzIHZhcmlhYmxlc1xuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3BvbnNlIGlzIG5vdCBlcXVhbCB0byAwIHRoYW4gd2Uga25vdyB0aGUgcmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlIT09MCl7XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzLycrJGxvY2FsU3RvcmFnZS5hcHBfdWlkKycvcm91dGUtY2FzZScpO1xuICAgICAgICAgICAgICAgICAgICAvL1NldCB0aGUgcGFyYW1zIGZvciB0aGUgcHV0IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgQVBJLnNldFBhcmFtcyh7J2RlbF9pbmRleCc6ICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXgsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04J30pO1xuICAgICAgICAgICAgICAgICAgICAvL01ha2UgYSBjYWxsIHRvIHRoZSBBUEkgdG8gcm91dGUgdGhlIGNhc2UgdG8gdGhlIG5leHQgdGFza1xuICAgICAgICAgICAgICAgICAgICAvL1NvbWV0aGluZyB0byBub3RlIGZvciBwcm9kdWN0aW9uIGVudmlyb25tZW50czpcbiAgICAgICAgICAgICAgICAgICAgLy9UaGlzIHNwZWNpZmljIHdvcmtmbG93IHdhcyBhIHNlcXVlbnRpYWwgd29ya2Zsb3cuIEZvciBwcm9kdWN0aW9uIGVudmlyb25lbW50cyB5b3UgbWF5IG5lZWQgdG8gYWRkXG4gICAgICAgICAgICAgICAgICAgIC8vQ3VzdG9tIGxvZ2ljIGZvciBpbnRlcnByZXRpbmcgdGhlIHJvdXRpbmcgcHJvY2VkdXJlIGZvciBvdGhlciB0eXBlcyBvZiByb3V0aW5nIHJ1bGVzXG4gICAgICAgICAgICAgICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL1Jlc2V0IHRoZSBkZWxlZ2F0aW9uIGluZGV4IHNpbmNlIHdlIGhhdmUgc3VibWl0dGVkIHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmRlbEluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVzZXQgdGhlIGFwcGxpY2F0aW9ucyB1bmlxdWUgaWRlbnRpZmllciBzaW5jZSB3ZSBoYXZlIHN1Ym1pdHRlZCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hcHBfdWlkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgdXNlciBiYWNrIHRvIHRoZWlyIGhvbWUgaW5ib3ggc2luY2UgdGhleSBoYXZlIHN1Ym1pdHRlZCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL2hvbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vRGlzcGxheSBhIHVzZXIgZnJpZW5kbHkgbWVzc2FnZSB0byB0aGUgdXNlciB0aGF0IHRoZXkgaGF2ZSBzdWNjZXNzZnVsbHkgc3VibWl0dGVkIHRoZSBjYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLm1lc3NhZ2UgPSAnJCRGb3JtU3VibWl0dGVkTWVzc2FnZSQkJztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLy9EZWZpbmUgdGhlIHJlcXVlc3QgdHlwZSwgaW4gdGhpcyBjYXNlLCBQVVRcbiAgICAgICAgICAgICAgICAgICAgJ1BVVCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL0RlZmluZSB0aGUgcmVxdWVzdCB0eXBlLCBpbiB0aGlzIGNhc2UsIFBVVFxuICAgICAgICAgICAgJ1BVVCcpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICAgICAqIEBuYW1lIGxvYWRDYXNlRGF0YVxuICAgICAgICAgKiBAZGVzYyBMb2FkcyB0aGUgZGF0YSBmcm9tIHRoZSBjYXNlIGFuZCBwb3B1bGF0ZXMgdGhlIGZvcm0gd2l0aCBpdFxuICAgICAgICAgKi9cbiAgICAgICAgJHNjb3BlLmxvYWRDYXNlRGF0YSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMvJyskbG9jYWxTdG9yYWdlLmFwcF91aWQrJy92YXJpYWJsZXMnKTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIEFQSSByZXF1ZXN0aW5nIHRoZSBkYXRhIG9mIHRoZSBjYXNlXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhIGlzIGdyZWF0ZXIgdGhhbiAwLCB3ZSBrbm93IHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICAgICAgaWYoJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIHJlc3BvbnNlIHRvIGEgdmFyaWFibGUgZm9yIGVhc2llciB1c2VcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAvL0xvb3AgdGhyb3VnaCBhbGwgdGhlIGlucHV0IGVsZW1lbnRzIG9uIHRoZSBmb3JtIGFuZCBwb3B1bGF0ZSB0aGVtIHdpdGggdGhlIGRhdGEgcmV0cmlldmVkIGZyb20gdGhlIEFQSVxuICAgICAgICAgICAgICAgICAgICAvL1RvRG8gc3VwcG9ydCBmb3Igb3RoZXIgZWxlbWVudHMgYmVzaWRlcyBpbnB1dCBlLmcuIHNlbGVjdCwgdGV4dGFyZWEsIHJhZGlvLCBjaGVja1xuICAgICAgICAgICAgICAgICAgICAkKCdmb3JtJykuZmluZCgnOmlucHV0JykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9XZSBmaXJzdCBjaGVjayB0byBtYWtlIHN1cmUgdGhhdCB0aGUgZmllbGQgaGFzIGEgcHJvcGVyIGlkXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1RoZW4gd2UgYXNzaWduIHRvIHRoZSBmaWVsZCdzIHZhbHVlIHdpdGggdGhlIGFzc29jaWF0ZWQgZmllbGQgcmV0dXJuZWQgZnJvbSB0aGUgQVBJXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZigkKHRoaXMpLmF0dHIoJ2lkJykpICE9PSAndW5kZWZpbmVkJyApICQodGhpcykudmFsKGRhdGFbJCh0aGlzKS5hdHRyKCdpZCcpXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIEhvbWVDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBIb21lIHBhZ2VcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignSG9tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYWxTdG9yYWdlKXtcbiAgICAvL0NoZWNrIGlmIGxvY2FsU3RvcmFnZSBoYXMgYSBtZXNzYWdlIHRvIGRpc3BsYXlcbiAgICBpZiAoICRsb2NhbFN0b3JhZ2UubWVzc2FnZSApe1xuICAgICAgICAvL1NldCB0aGUgbmV3TWVzc2FnZSB0byB0cnVlIHNvIHRoYXQgaXQgd2lsbCBzaG93IG9uIHRoZSBob21lIHBhZ2VcbiAgICAgICAgJHNjb3BlLm5ld01lc3NhZ2UgPSB0cnVlO1xuICAgICAgICAvL1NldCB0aGUgbWVzc2FnZSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGluIHRoZSB2aWV3XG4gICAgICAgICRzY29wZS5XZWxjb21lTWVzc2FnZSA9ICRsb2NhbFN0b3JhZ2UubWVzc2FnZTtcbiAgICB9ZWxzZXtcbiAgICAgICAgLy9ObyBtZXNzYWdlIGluIHRoZSBsb2NhbFN0b3JhZ2UsIHNvIHNldCBuZXdNZXNzYWdlIHRvIGZhbHNlXG4gICAgICAgICRzY29wZS5uZXdNZXNzYWdlID0gZmFsc2U7XG4gICAgICAgIC8vRGlzcGxheSB0aGUgZGVmYXVsdCBtZXNzYWdlXG4gICAgICAgICRzY29wZS5XZWxjb21lTWVzc2FnZSA9ICckJFdlbGNvbWVNZXNzYWdlJCQnO1xuICAgIH1cbiAgICAvL0Rlc3RvcnkgdGhlIG1lc3NhZ2UgaW4gdGhlIGxvY2FsU3RvcmFnZSBub3cgdGhhdCB3ZSBoYXZlIGRpc3BsYXllZCBpdCBpbiB0aGUgc2NvcGVcbiAgICAkbG9jYWxTdG9yYWdlLm1lc3NhZ2UgPSBudWxsO1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIEluYm94Q3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgSW5ib3ggcGFnZVxuICovXG4vKiBnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignSW5ib3hDdHJsJywgZnVuY3Rpb24gKEFQSSwgJHNjb3BlKXtcbiAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgIEFQSS5zZXRSZXF1ZXN0VHlwZSgnY2FzZXMnKTtcbiAgICAgICAgLy9NYWtlIHRoZSBBUEkgY2FsbCB0byBnZXQgdGhlIGxpc3Qgb2YgY2FzZXMgaW4gVG8gRG8gc3RhdHVzXG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5odG1sKFxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLW9rIGJsdWVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgTmV3Y2FzZUN0cmxcbiAqIEBkZXNjIFRoaXMgY29udHJvbHMgdGhlIE5ldyBDYXNlIHBhZ2VcbiAqL1xuLypnbG9iYWwgJDpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuYW5ndWxhci5tb2R1bGUoJ3BtQW5ndWxhcicpXG4uY29udHJvbGxlcignTmV3Y2FzZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCBBUEkpe1xuICAgICAgICAvL0Fzc2lnbiB0aGUgbGlzdCBvZiBzdGFydGluZyB0YXNrcyBmcm9tIGxvY2FsU3RvcmFnZSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIGl0IGluIHRoZSB2aWV3XG4gICAgICAgICRzY29wZS50YXNrTGlzdCA9ICRsb2NhbFN0b3JhZ2Uuc3RhcnRpbmdUYXNrcztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICAgICAgICAgKiBAbmFtZSBzdGFydENhc2VcbiAgICAgICAgICogQGRlc2MgU3RhcnRzIGEgbmV3IGNhc2UgaW4gUHJvY2Vzc01ha2VyXG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUuc3RhcnRDYXNlID0gZnVuY3Rpb24oYWN0X3VpZCl7XG4gICAgICAgICAgICAvL1NldHRpbmcgdGhlIGFjdGl2aXR5IHVpZCB0byBsb2NhbFN0b3JhZ2UgZm9yIGxhdGVyIHVzZVxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hY3RfdWlkID0gYWN0X3VpZDtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcycpO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHBhcmFtcyBmb3IgdGhlIHBvc3QgcmVxdWVzdFxuICAgICAgICAgICAgQVBJLnNldFBhcmFtcyh7cHJvX3VpZDogJGxvY2FsU3RvcmFnZS5wcm9fdWlkLCB0YXNfdWlkOiAkbG9jYWxTdG9yYWdlLmFjdF91aWR9KTtcbiAgICAgICAgICAgIC8vTWFrZSBhIGNhbGwgdG8gdGhlIFJFU1QgQVBJIHRvIHN0YXJ0IGEgY2FzZVxuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaXMgZ3JlYXRlciB0aGFuIDAsIHRoZW4gd2Uga25vdyB3ZSdyZSBpbiBidXNpbmVzcyFcbiAgICAgICAgICAgICAgICBpZiggJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwICl7XG4gICAgICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgdXNlciB0byB0aGUgb3BlbmNhc2UgcGFnZSwgdGhlcmUgd2UgZGlzcGxheSB0aGUgZHluYWZvcm1cbiAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL29wZW5jYXNlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vU2V0IHRoZSBsb2NhbFN0b3JhZ2UgYXBwbGljYXRpb24gdW5pcXVlIGlkZW50aWZpZXIgdG8gdGhhdCB3aGljaCB3YXMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX3VpZCA9IHJlc3BvbnNlLmRhdGEuYXBwX3VpZDtcbiAgICAgICAgICAgICAgICAgICAgLy9TZXQgdGhlIGxvY2FsU3RvcmFnZSBhcHBsaWNhdGlvbiBudW1iZXIgdG8gdGhhdCB3aGljaCB3YXMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYXBwX251bWJlciA9IHJlc3BvbnNlLmRhdGEuYXBwX251bWJlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9EZWZpbmUgdGhlIHJlcXVlc3QgdHlwZSwgaW4gdGhpcyBjYXNlLCBQT1NUXG4gICAgICAgICAgICAnUE9TVCcpO1xuICAgICAgICB9O1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIE5ld3Byb2Nlc3NDdHJsXG4gKiBAZGVzYyBUaGlzIGNvbnRyb2xzIHRoZSBOZXcgUHJvY2VzcyBQYWdlXG4gKi9cbi8qZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ05ld3Byb2Nlc3NDdHJsJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGh0dHAsICRsb2NhdGlvbiwgJGxvY2FsU3RvcmFnZSwgQVBJKXtcbiAgICAgICAgJHNjb3BlLmdldFByb2Nlc3NMaXN0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vU2V0IHRoZSByZXF1ZXN0VHlwZVxuICAgICAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdwcm9qZWN0Jyk7XG4gICAgICAgICAgICAvL01ha2UgdGhlIEFQSSBjYWxsIHRvIGdldCB0aGUgbGlzdCBvZiBhdmFpbGFibGUgcHJvY2Vzc2VzXG4gICAgICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgQVBJIHRvIHRoZSBzY29wZSBzbyB0aGF0IHdlXG4gICAgICAgICAgICAgICAgLy9DYW4gcmVuZGVyIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBkYXRhXG4gICAgICAgICAgICAgICAgJHNjb3BlLnByb0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgICAgICAgICAgLy9NZXNzYWdlIHN0YXRpbmcgdGhhdCB0aGVyZSBpcyBub3RoaW5nIHRvIGRpc3BsYXlcbiAgICAgICAgICAgICAgICBpZigkc2NvcGUucHJvTGlzdC5sZW5ndGg9PT0wKXtcbiAgICAgICAgICAgICAgICAgICAgLy8jbmV3LXByb2Nlc3MtYXJlYSBpcyB0aGUgYXJlYSBvbiB0aGUgcGFnZSB3ZSBhcmUgcmVuZGVyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vVGhlIGxpc3Qgb2YgcHJvY2Vzc2VzLCBzbyB3ZSBhcmUgc2V0dGluZyBpdCdzIEhUTUwgZXF1YWwgdG8gdGhlIGRpc3BsYXkgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAkKCcjbmV3LXByb2Nlc3MtYXJlYScpLmh0bWwoJyQkTm9Qcm9jZXNzZXNUb0Rpc3BsYXlNZXNzYWdlJCQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0oKTsvL1dlIGF1dG8gaW5zdGFudGlhdGUgdGhlIG1ldGhvZCBpbiBvcmRlciB0byBoYXZlIGl0IGdldCB0aGUgaW5mb3JtYXRpb24gZnJvbSB0aGUgQVBJIGFuZCBkaXNwbGF5IG9uIGxvYWQgb2YgdGhlIGNvbnRyb2xsZXJcblxuICAgICAgICAvL1RoaXMgbWV0aG9kIHN0YXJ0cyBhIHByb2Nlc3MgYW5kIGdldHMgdGhlIGFzc29jaWF0ZWQgc3RhcnRpbmcgdGFza3Mgb2YgdGhlIHByb2Nlc3MgYW5kIGRpc3BsYXlzIHRoZW1cbiAgICAgICAgLy9JdCB0YWtlcyBvbmUgcGFyYW0sIHRoZSBwcm9jZXNzIHVuaXF1ZSBpZGVudGlmaWVyIHRoYXQgd2Ugd2FudCB0byBzdGFydFxuICAgICAgICAkc2NvcGUuc3RhcnRQcm9jZXNzID0gZnVuY3Rpb24ocHJvX3VpZCl7XG4gICAgICAgICAgICAvL1NldHRpbmcgdGhlIHByb2Nlc3MgdWlkIHRvIGxvY2FsU3RvcmFnZSBmb3IgbGF0ZXIgdXNlXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnByb191aWQgPSBwcm9fdWlkO1xuICAgICAgICAgICAgLy9TZXQgdGhlIHJlcXVlc3RUeXBlXG4gICAgICAgICAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ3Byb2plY3QvJyskbG9jYWxTdG9yYWdlLnByb191aWQrJy9zdGFydGluZy10YXNrcycpO1xuICAgICAgICAgICAgLy9DYWxsIHRvIHRoZSBSRVNUIEFQSSB0byBsaXN0IGFsbCBhdmFpbGFibGUgc3RhcnRpbmcgdGFza3MgZm9yIHRoZSBzcGVjaWZpZWQgcHJvY2Vzc1xuICAgICAgICAgICAgQVBJLmNhbGwoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIC8vU2VuZCB0aGUgbGlzdCBvZiBuZXcgY2FzZXMgdG8gbG9jYWxTdG9yYWdlIHNvIHRoYXQgdGhlIE5ld2Nhc2VDdHJsIGNvbnRyb2xsZXIgY2FuIHVzZSBpdFxuICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2Uuc3RhcnRpbmdUYXNrcyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgLy9DaGFuZ2UgdGhlIHVybCBzbyB0aGF0IHRoZSBuZXcgY2FzZSBwYWdlIGlzIGRpc3BsYXllZFxuICAgICAgICAgICAgICAgICRsb2NhdGlvbi51cmwoJy9uZXdjYXNlJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KTsiLCIvKipcbiAqIEBhdXRob3IgZXRoYW5AY29sb3NhLmNvbVxuICogQGRhdGUgNy8yOS8xNFxuICogQG5hbWUgUGFydGljaXBhdGVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgUGFydGljaXBhdGVkIHBhZ2VcbiAqL1xuLyogZ2xvYmFsICQ6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcbmFuZ3VsYXIubW9kdWxlKCdwbUFuZ3VsYXInKVxuLmNvbnRyb2xsZXIoJ1BhcnRpY2lwYXRlZEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBUEkpIHtcbiAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICBBUEkuc2V0UmVxdWVzdFR5cGUoJ2Nhc2VzL3BhcnRpY2lwYXRlZCcpO1xuICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIHBhcnRpY2lwYXRlZCBzdGF0dXNcbiAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgJHNjb3BlLmNhc2VzTGlzdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vSWYgdGhlIHJlc3VsdGluZyBkYXRhIGxlbmd0aCBpcyBlcXVhbCB0byAwLCB0aGVuIHdlIGRpc3BsYXkgYSB1c2VyIGZyaWVuZGx5XG4gICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgIGlmKCRzY29wZS5jYXNlc0xpc3QubGVuZ3RoPT09MCl7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgJCgnI2Nhc2VzLXRhYmxlJykuaHRtbChcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjbG9zZVwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCI+JytcbiAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24tb2sgYmx1ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAnJCROb0Nhc2VzTWVzc2FnZSQkJytcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiLyoqXG4gKiBAYXV0aG9yIGV0aGFuQGNvbG9zYS5jb21cbiAqIEBkYXRlIDcvMjkvMTRcbiAqIEBuYW1lIFJvb3RDdHJsXG4gKiBAZGVzYyBUaGlzIGlzIHRoZSByb290IGNvbnRyb2xsZXIuIEl0IGNvbnRyb2xzIGFzcGVjdHMgcmVsYXRlZCB0byB0aGUgYXBwbGljYXRpb24gZnJvbSBhIGhpZ2hlciBsZXZlbFxuICovXG4vKmdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdSb290Q3RybCcsIGZ1bmN0aW9uIFJvb3RDdHJsKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkbG9jYWxTdG9yYWdlLCAkcm91dGUsICRodHRwLCBBUEksIGFwcFRpdGxlLCBnZW5lcmljSGVhZGVycywgYWN0aXZlTWVudUl0ZW1zLCBhcGlfdXJsLCBBY2Nlc3NUb2tlbil7XG4gICAgLy9EZWZpbmUgdGhlIGNvbHVtbiBuYW1lcyBmb3IgdGhlIGdyaWRzLiBJbiB0aGlzIGNhc2UsIHdlIGFyZSBjcmVhdGluZyBnbG9iYWwgY29sdW1ucywgYnV0IHlvdSBjb3VsZCBqdXN0IHJlZGVmaW5lIHRoaXMgYXJyYXkgb24gYW55IGNvbnRyb2xsZXJcbiAgICAvL1RvIG92ZXJ3cml0ZSB0aGVtIGZvciBhIHNwZWNpZmljIHBhZ2VcbiAgICAkc2NvcGUuZ3JpZEhlYWRlcnMgPSBnZW5lcmljSGVhZGVycztcbiAgICAvL0RlZmluZSB0aGUgYXBwbGljYXRpb24gdGl0bGUgYW5kIHNldCBpdCB0byB0aGUgc2NvcGUgc28gdGhhdCB0aGUgdmlldyByZW5kZXJzIGl0XG4gICAgJHNjb3BlLmFwcFRpdGxlID0gYXBwVGl0bGU7XG4gICAgLy9UaGlzIGZ1bmN0aW9uIHNldHMgdGhlIHNpZGViYXIgbWVudSB0byBhY3RpdmUgYmFzZWQgb24gdGhlIHBhZ2Ugc2VsZWN0ZWRcbiAgICAkc2NvcGUuc2V0U2VsZWN0ZWRQYWdlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgLy9MaXN0IG9mIGFsbCB0aGUgbWVudSBpdGVtcyBzbyB0aGF0IHdlIGNhbiBsb29wIHRocm91Z2ggdGhlbVxuICAgICAgICB2YXIgbGlzdCA9IGFjdGl2ZU1lbnVJdGVtcztcbiAgICAgICAgLy9Mb29wIHRocm91Z2ggYWxsIHRoZSBtZW51IGl0ZW1zXG4gICAgICAgICQuZWFjaChsaXN0LCBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICAgICAgICAgIC8vQ2hlY2sgaWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBlcXVhbCBhIGtleVxuICAgICAgICAgICAgLy9JZiBpdCBpcywgbWFrZSBpdCBhY3RpdmVcbiAgICAgICAgICAgIGlmKCRyb3V0ZS5jdXJyZW50LmN1cnJlbnRQYWdlID09PSBrZXkpICRzY29wZVt2YWx1ZV0gPSAnYWN0aXZlJztcbiAgICAgICAgICAgIC8vT3RoZXJ3aXNlLCBtYWtlIHRoZSByZXN0IG9mIHRoZW0gaW5hY3RpdmUgc28gb25seSB0aGUgY3VycmVudGx5IGFjdGl2ZSBvbmUgaXMgZGlzcGxheWVkIGFzIGFjdGl2ZVxuICAgICAgICAgICAgZWxzZSAkc2NvcGVbdmFsdWVdID0gJyc7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmFtZSAhISFFdmVudHMhISFcbiAgICAgICAgICogQGRlc2MgVGhpcyBpcyB3aGVyZSB3ZSB3aWxsIGRlZmluZSBhIGJ1bmNoIG9mIGV2ZW50cyBhbmQgd2hhdCBoYXBwZW5zIGR1cmluZyB0aG9zZSBldmVudHNcbiAgICAgICAgICogQGRlc2MgRnVuIHN0dWZmISEhIVxuICAgICAgICAgKi9cbiAgICAvL1doZW4gdGhlIGFwcGxpY2F0aW9ucyBzdGF0ZSBoYXMgY2hhbmdlZCB0byBhbm90aGVyIHJvdXRlLCB3ZSB3YW50IHRvIGZpcmUgc29tZSB0aGluZ3Mgb24gdGhpcyBldmVudFxuICAgICRzY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAvL0NoYW5nZSB0aGUgbWVudSBpdGVtIHNlbGVjdGVkIGFzIGFjdGl2ZSB3aGVuZXZlciB0aGUgcGFnZSBpcyBjaGFuZ2VkXG4gICAgICAgICRzY29wZS5zZXRTZWxlY3RlZFBhZ2UoKTtcbiAgICAgICAgLy9TZXQgdGhlIGN1cnJlbnQgcGFnZXMgbmFtZSB0byB0aGUgY3VycmVudCBwYWdlXG4gICAgICAgICRzY29wZS5jdXJyZW50UGFnZSA9ICRyb3V0ZS5jdXJyZW50LmN1cnJlbnRQYWdlO1xuICAgICAgICAvL1NldCB0aGUgY3VycmVudCBwYWdlcyBkZXNjcmlwdGlvbiB0byB0aGUgY3VycmVudCBwYWdlcyBkZXNjcmlwdGlvblxuICAgICAgICAkc2NvcGUucGFnZURlc2MgPSAkcm91dGUuY3VycmVudC5wYWdlRGVzYztcbiAgICAgICAgLy9XZSB3YW50IHRvIGRlc3Ryb3kgdGhlIGRlbGVnYXRpb24gaW5kZXggaWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3QgYSBkeW5hZm9ybSBzbyB0aGF0IHRoZSBuZXh0IHRpbWVcbiAgICAgICAgLy9XZSBsb2FkIGEgcGFnZSwgaXQgZG9lcyBub3QgdXNlIGEgZGVsZWdhdGlvbiBpbmRleCBvZiBhIGRpZmZlcmVudCBhcHBsaWNhdGlvblxuICAgICAgICBpZigkc2NvcGUuY3VycmVudFBhZ2UgIT09ICdEeW5hZm9ybScpICRsb2NhbFN0b3JhZ2UuZGVsSW5kZXggPSBudWxsO1xuICAgIH0pO1xuICAgIC8vV2hlbiB0aGUgdXNlciBsb2dzIGluLCB3ZSBkbyBzb21lIHRoaW5ncyBvbiB0aGlzIGV2ZW50XG4gICAgJHNjb3BlLiRvbignb2F1dGg6bG9naW4nLCBmdW5jdGlvbihldmVudCwgdG9rZW4pe1xuICAgICAgICAvL1RoaXMgaXMgRVhUUkVNRUxZIGltcG9ydGFudCAtIFRoZSB3aG9sZSBVSSBpcyByZW5kZXJlZCBiYXNlZCBvbiBpZiB0aGlzIGlzIGFuIGFjY2VzX3Rva2VuXG4gICAgICAgIC8vU28sIHdlIGFzc2lnbiB0aGUgc2NvcGVzIGFjY2Vzc1Rva2VuIHRvIHRoZSB0b2tlblxuICAgICAgICAvL0lmIHRoZSB1c2VyIGlzIG5vdCBsb2dnZWQgaW4sIHRoZSB0b2tlbiBvYmplY3Qgd2lsbCBiZSB1bmRlZmluZWRcbiAgICAgICAgLy9JZiB0aGUgdXNlciBJUyBsb2dnZWQgaW4sIHRoZSB0b2tlbiBvYmplY3Qgd2lsbCBob2xkIHRoZSB0b2tlbiBpbmZvcm1hdGlvblxuICAgICAgICAvL0UuZy4gYWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VuLCBleHBpcnkgZXRjXG4gICAgICAgICRzY29wZS5hY2Nlc3NUb2tlbiA9IHRva2VuLmFjY2Vzc190b2tlbjtcbiAgICAgICAgLy9EdXJpbmcgdGhlIGF1dGhlbnRpY2F0aW9uIHByb2Nlc3MgdGhlIGh0dHAgaGVhZGVycyBjb3VsZCBoYXZlIGNoYW5nZWQgdG8gQmFzaWNcbiAgICAgICAgLy9TbyB3ZSBqdXN0IHJlaW5mb3JjZSB0aGUgaGVhZGVycyB3aXRoIHRoZSBCZWFyZXIgYXV0aG9yaXphdGlvbiBhcyB3ZWxsIGFzIHRoZSB1cGRhdGVkIGFjY2Vzc190b2tlblxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5BdXRob3JpemF0aW9uID0gJ0JlYXJlciAnICsgJHNjb3BlLmFjY2Vzc1Rva2VuO1xuICAgIH0pO1xuICAgIC8vV2hlbiB0aGUgdXNlciBsb2dzIG91dCwgd2UgZG8gc29tZSB0aGluZ3Mgb24gdGhpcyBldmVudFxuICAgICRzY29wZS4kb24oJ29hdXRoOmxvZ291dCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vVGhlIHVzZXIgaGFzIGxvZ2dlZCBvdXQsIHNvIHdlIGRlc3Ryb3kgdGhlIGFjY2Vzc190b2tlblxuICAgICAgICAvL0JlY2F1c2Ugb2YgQW5ndWxhcnMgYXdlc29tZSBsaXZlIGRhdGEgYmluZGluZywgdGhpcyBhdXRvbWF0aWNhbGx5IHJlbmRlcnMgdGhlIHZpZXcgaW5uYXRlXG4gICAgICAgICRzY29wZS5hY2Nlc3NUb2tlbiA9IG51bGw7XG4gICAgICAgIC8vRGVzdG9yeSB0aGUgQWNjZXNzVG9rZW4gb2JqZWN0XG4gICAgICAgIEFjY2Vzc1Rva2VuLmRlc3Ryb3koKTtcbiAgICAgICAgLy9TZXQgdGhlIHBhZ2VzIG5hbWUgdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlID0gJ1BsZWFzZSBMb2dpbi4nO1xuICAgICAgICAvL1NldCB0aGUgcGFnZXMgZGVzY3JpcHRpb24gdG8gYW4gdW5hdXRob3JpemVkIG1lc3NhZ2VcbiAgICAgICAgJHNjb3BlLnBhZ2VEZXNjID0gJyQkRGVmYXVsdFdlbGNvbWVNZXNzYWdlJCQnO1xuICAgICAgICAvL1JlZGlyZWN0IHRoZSB1c2VyIGJhY2sgdG8gdGhlIGhvbWUgcGFnZVxuICAgICAgICAkbG9jYXRpb24udXJsKCcvaG9tZScpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gICAgICogQG5hbWUgb3BlbkNhc2VcbiAgICAgKiBAZGVzYyBPcGVucyBhIGR5bmFmb3JtIGFuZCBkaXNwbGF5cyB0aGUgZGF0YSBmb3IgdGhlIHVzZXJcbiAgICAgKiBAcGFyYW0gYXBwX3VpZCAtIHJlcXVpcmVkIC0gdGhlIGFwcGxpY2F0aW9uIHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2FzZSB5b3Ugd2lzaCB0byBvcGVuXG4gICAgICogQHBhcmFtIGRlbEluZGV4IC0gcmVxdWlyZWQgLSB0aGUgZGVsZWdhdGlvbiBpbmRleCBvZiB0aGUgY3VycmVudCBhcHBsaWNhdGlvbiB0aGF0IHlvdSBhcmUgb3BlbmluZ1xuICAgICAqL1xuICAgICRzY29wZS5vcGVuQ2FzZSA9IGZ1bmN0aW9uKGFwcF91aWQsIGRlbEluZGV4KXtcbiAgICAgICAgLy9IaWRlIHRoZSB2aWV3IG9mIHRoZSBjYXNlcyBsaXN0IHNvIHRoYXQgd2UgY2FuIGRpc3BsYXkgdGhlIGZvcm1cbiAgICAgICAgJCgnI2Nhc2VzLXRhYmxlJykuaGlkZSgpO1xuICAgICAgICAvL1Nob3cgdGhlIHZpZXcgb2YgdGhlIGZvcm1cbiAgICAgICAgJCgnI2Zvcm0tYXJlYScpLnNob3coKTtcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy8nK2FwcF91aWQpO1xuICAgICAgICBBUEkuY2FsbChmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICBpZiggJChyZXNwb25zZS5kYXRhKS5zaXplKCkgPiAwICl7XG4gICAgICAgICAgICAgICAgLy9Bc3NpZ24gdGhlIGxvY2FsU3RvcmFnZSBkYXRhOlxuICAgICAgICAgICAgICAgIC8vVGhlIGFwcGxpY2F0aW9ucyBudW1iZXJcbiAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFwcF9udW1iZXIgPSByZXNwb25zZS5kYXRhLmFwcF9udW1iZXI7XG4gICAgICAgICAgICAgICAgLy9UaGUgcHJvY2VzcyB1bmlxdWUgaWRlbnRpZmllciB0aGF0IHRoZSBjYXNlIGlzIGFzc29jaWF0ZWQgdG9cbiAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnByb191aWQgPSByZXNwb25zZS5kYXRhLnByb191aWQ7XG4gICAgICAgICAgICAgICAgLy9UaGUgYWN0aXZpdHkvZm9ybSB1bmlxdWUgaWRlbnRpZmllciB0aGF0IHdlIGFyZSBnb2luZyB0byBkaXNwYWx5XG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hY3RfdWlkID0gcmVzcG9uc2UuZGF0YS5jdXJyZW50X3Rhc2tbMF0udGFzX3VpZDtcbiAgICAgICAgICAgICAgICAvL1RoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFwcF91aWQgPSBhcHBfdWlkO1xuICAgICAgICAgICAgICAgIC8vVGhlIGRlbGVnYXRpb24gaW5kZXggb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5kZWxJbmRleCA9IGRlbEluZGV4O1xuICAgICAgICAgICAgICAgIC8vUmVkaXJlY3QgdGhlIHVzZXIgdG8gdGhlIG9wZW5jYXNlIGZvcm0gd2hlcmUgd2Ugd2lsbCBkaXNwbGF5IHRoZSBkeW5hZm9ybVxuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvb3BlbmNhc2UnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsIi8qKlxuICogQGF1dGhvciBldGhhbkBjb2xvc2EuY29tXG4gKiBAZGF0ZSA3LzI5LzE0XG4gKiBAbmFtZSBVbmFzc2lnbmVkQ3RybFxuICogQGRlc2MgVGhpcyBjb250cm9scyB0aGUgVW5hc3NpZ25lZCBwYWdlXG4gKi9cbi8qIGdsb2JhbCAkOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5hbmd1bGFyLm1vZHVsZSgncG1Bbmd1bGFyJylcbi5jb250cm9sbGVyKCdVbmFzc2lnbmVkQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEFQSSkge1xuICAgICAgICAvL1NldCB0aGUgcmVxdWVzdFR5cGVcbiAgICAgICAgQVBJLnNldFJlcXVlc3RUeXBlKCdjYXNlcy91bmFzc2lnbmVkJyk7XG4gICAgICAgIC8vTWFrZSB0aGUgQVBJIGNhbGwgdG8gZ2V0IHRoZSBsaXN0IG9mIGNhc2VzIGluIHVuYXNzaWduZWQgc3RhdHVzXG4gICAgICAgIEFQSS5jYWxsKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIC8vQXNzaWduIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIEFQSSB0byB0aGUgc2NvcGUgc28gdGhhdCB3ZSBjYW4gcmVuZGVyIHRoZSB2aWV3IHdpdGggdGhlIGRhdGFcbiAgICAgICAgICAgICRzY29wZS5jYXNlc0xpc3QgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgLy9JZiB0aGUgcmVzdWx0aW5nIGRhdGEgbGVuZ3RoIGlzIGVxdWFsIHRvIDAsIHRoZW4gd2UgZGlzcGxheSBhIHVzZXIgZnJpZW5kbHlcbiAgICAgICAgICAgIC8vTWVzc2FnZSBzdGF0aW5nIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBkaXNwbGF5XG4gICAgICAgICAgICBpZigkc2NvcGUuY2FzZXNMaXN0Lmxlbmd0aD09PTApe1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRvZG8gY3JlYXRlIHNvbWUgdHlwZSBvZiBkaXJlY3RpdmUvc2VydmljZSB0byByZW5kZXIgbWVzc2FnZXMgaW4gdGhlIGFwcGxpY2F0aW9uIHdpdGgganVzdCBhIHF1aWNrIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAkKCcjY2FzZXMtdGFibGUnKS5odG1sKFxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LWluZm9cIj4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLXJlbW92ZVwiPjwvaT4nK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicrXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uLW9rIGJsdWVcIj48L2k+JytcbiAgICAgICAgICAgICAgICAgICAgICAgICckJE5vQ2FzZXNNZXNzYWdlJCQnK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==