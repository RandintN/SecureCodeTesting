'use strict';
module.exports = function(app) {
    //path to the file with the function to call
    var addOrganization = require('./endpoint-connections');

    // Route the webservices of new org
    app.route('/add-org').get(addOrganization.send_json);
    app.route('/add-org').get(addOrganization.request_orderer_genesis);   
    app.route('/add-org').get(addOrganization.receive_orderer_genesis_new_org);

}
