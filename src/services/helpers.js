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
        showMessageArea: function(id, msg, level, debug){
            debug = (angular.isUndefined(debug))? false : debug;
            level = (angular.isUndefined(level))? 'info' : level;
            if(debug) console.log("ID: "+id+"\n\r"+"Message: "+msg);
            $(id).html(
                '<div class="alert alert-block alert-'+level+'">'+
                '<button type="button" class="close" data-dismiss="alert">'+
                '<i class="icon-remove"></i>'+
                '</button>'+
                '<p> '+
                msg+
                    '</p></div>'
            );
        }
    };
});