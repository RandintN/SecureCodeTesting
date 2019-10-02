'use strict';
module.exports = function(app) {
    //path to the file with the function to call
    var addOrganization = require('./new-org-endpoints');

    // Route webservices of n2med Backoffice Onboarding
    app.route('/add-org').get(addOrganization.receive_json_new_org);
    app.route('/add-org').get(addOrganization.send_orderer_genesis_to_new_org);
    
}
