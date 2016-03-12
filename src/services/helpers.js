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