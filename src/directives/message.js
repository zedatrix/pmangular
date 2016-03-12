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