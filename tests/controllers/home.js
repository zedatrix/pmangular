describe('HomeController', function() {
    beforeEach(module('pmAngular'));

    var $controller;

    beforeEach(inject(function(_$controller_){
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;
    }));

    describe('$scope.newMessage', function() {
        var $scope, controller;

        beforeEach(function() {
            $scope = {};
            controller = $controller('HomeController', { $scope: $scope });
        });

        it('Tests if $scope.newMessage is true or false based on $localStorage.message value', function(){
            $localStorage.message = null;
            expect($scope.newMessage).toEqual(false);
        });
    });
});