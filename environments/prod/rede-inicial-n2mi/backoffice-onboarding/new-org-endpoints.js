'use strict';

const fs = require('fs');
const exec = require('child_process').exec;

exports.receive_json_new_org = async function (orgPeerJson, orgOrdererJson, ordererTLS) {
       //Type POST
       // Copy files to appropriate folder
       // execute script inside docker exec cli ./add-org-channel
       // ping response to new org 

       var newOrgPeerJson = orgJson;
       var newOrgOrdererJson = ordererTLS;
       var newOrgOrdererTLS = ordererTLS;

       fs.writeFileSync('../config/' + orgPeerJson + '.json', newOrgPeerJson);
       fs.writeFileSync('../config/' + orgOrdererJson + '.json', newOrgOrdererJson);
       fs.writeFileSync('../config/' + 'server.crt', newOrgOrdererTLS);

       exec("docker exec cli sh -c '/etc/hyperledger/channel-artifacts/add-org-n2medchannel.sh " + orgPeerJson + ' ' + orgOrdererJson + "'");

       var doneAddingOrg = "We have finished adding the org to the system channels, you may now fetch and join the channel with the peer"

       return doneAddingOrg;
};

exports.send_orderer_genesis_to_new_org = function () {

       //Generate orderer genesis
       //N2med endpoint for new org to get genesis block
       //Post from New Org and send orderer genesis as  response

       exec('docker exec cli peer channel fetch config n2medchannel.block -o orderer.n2med.com:7050 -c n2med-system-channel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt');

       var n2medOrdererGenesis = fs.readFileSync('../config/n2medchannel.block');

       request.post('192.168.68.133:3000/receive-json', n2medOrdererGenesis,
              function (error, response, body) {
              if (!error && response.statusCode == 200) {
                     console.log(body);
                            }
                     }
       );
};



