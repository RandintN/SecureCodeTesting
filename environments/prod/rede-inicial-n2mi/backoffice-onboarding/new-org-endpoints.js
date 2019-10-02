'use strict';

const fs = require('fs');
const exec = require('child_process').exec;

exports.receive_json_new_org = function (orgPeerJson, orgOrdererJson, ordererTLS) {
      //Type POST
      
       var newOrgPeerJson = orgJson;
       var newOrgOrdererJson = ordererTLS;
       var newOrgOrdererTLS = ordererTLS;

       fs.writeFileSync(orgPeerJson + '.json', newOrgPeerJson);
       fs.writeFileSync(orgOrdererJson + '.json', newOrgOrdererJson);
       fs.writeFileSync('server.crt', newOrgOrdererTLS);

       var doneAddingOrg = "We have finished adding the org to the system channels, you may now fetch and join the channel with the peer"
        // Copy files to appropriate folder
       // execute script inside docker exec cli ./add-org-channel
       // ping response to new org 
       return doneAddingOrg;
};

exports.send_orderer_genesis_to_new_org = function () {

       //Generate orderer genesis
       //N2med endpoint for new org to get genesis block
       //Post from New Org and send orderer genesis as  response

       exec('sh generateOrdererGenesis.sh ');

       var n2medOrdererGenesis = fs.readFileSync('../config/n2medchannel.block');;

       
           request.post(
              '192.168.68.133:3000/receive-json',
              n2medOrdererGenesis,
              function (error, response, body) {
              if (!error && response.statusCode == 200) {
                     console.log(body);
                            }
                     }
              );

};



