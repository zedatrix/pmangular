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