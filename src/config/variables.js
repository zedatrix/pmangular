//The url for the REST API
angular.module('pmAngular').value('api_url', '$$ApiUrl$$');
angular.module('pmAngular').value('config_object', $$ConfigObject$$);
//Inject the name of the application into our application so that we can use iit
//When we render the page
angular.module('pmAngular').value('appTitle', '$$AppTitle$$');
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