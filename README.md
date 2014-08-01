> -
# pmAngular
*AngularJS meets ProcessMaker!*
>
> -

## What is this?
[AngularJS](https://angularjs.org/) is **awesome**!

[ProcessMaker](http://www.processmaker.com/) is **amazing**!
<<<<<<< HEAD:README.MD

**Now you can connect the two, thanks to ProcessMaker's new REST API with OAuth 2.0!**

This app is uses the following tools:

[NodeJS](http://nodejs.org/)
[Yeoman](http://yeoman.io/)
[AngularJS](https://angularjs.org/)
[jQuery](http://jquery.com/)
[Bootstrap](http://getbootstrap.com/)

This app uses the following angular addons:
angular-bootstrap
angular-route
angular-ui-bootstrap
ngOauth (modified version)
ngStorage

## Getting Started

To install:

Clone/fork the repo: [https://github.com/zeddie/pmangular.git](https://github.com/zeddie/pmangular.git)

You will need [NodeJS](http://nodejs.org/) installed.

Install yeoman:
```
$ npm install -g yo
```

Install npm dependencies:
```
$ npm install
```

Install bower dependencies:
```
$ bower install
```

## Connecting to ProcessMaker

You can use the settings defined to connect to a demo instance of ProcessMaker.

If you want to connect to your own ProcessMaker 3.0, you will need to follow the wiki steps outlined here: [ProcessMaker Wiki](http://3x.wiki.processmaker.com/index.php/OAUTH_2.0).

You can download the BETA version of ProcessMaker 3.0 from [here](http://sourceforge.net/projects/processmaker/files/ProcessMaker/3.0/3.0-Beta/).

The app is already configured to connect with the ProcessMaker 3.0 OAuth 2.0 flow, you just need to create the app on your instance and then swap the ```site```, ```redirect_uri```, ```client_id``` and the ```client_secret``` to that which you will receive when you create your app.