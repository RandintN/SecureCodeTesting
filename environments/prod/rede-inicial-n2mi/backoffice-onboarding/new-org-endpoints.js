'use strict';

const fs = require('fs');
var request = require('request');
const exec = require('child_process').exec;

exports.receive_json_new_org = function (request, response) {

       const jsonPayload =  JSON.parse(JSON.stringify(request.body));

       const orgName = jsonPayload.orgName;
       const orgJson = JSON.stringify(jsonPayload.org, null, "\t");
       const ordererName = jsonPayload.ordererName;
       const ordererJson = JSON.stringify(jsonPayload.orderer, null, "\t");
       const tls = jsonPayload.tls;
       
       fs.writeFileSync('../config/'+ orgName +'.json', orgJson);
       fs.writeFileSync('../config/'+ ordererName +'.json', ordererJson);
       fs.writeFileSync('../config/server.crt', tls);

       console.log("Orderer server.crt written",tls);
       const output = exec("docker exec cli /bin/bash -c '/etc/hyperledger/channel-artifacts/add-org-n2medchannel.sh '" + orgName + ' ' + ordererName +"'", {encoding: 'utf-8'});
       console.log("output ", output);
       //exec("docker exec cli sh -c '/etc/hyperledger/channel-artifacts/add-org-n2medchannel.sh " + orgPeerJson + ' ' + orgOrdererJson + "'");

       var doneAddingOrg = "We have finished adding the org to the system channels, you may now fetch and join the channel with the peer"

       response.send(doneAddingOrg);
};

exports.send_orderer_genesis_to_new_org = function () {

       var n2medOrdererGenesis = fs.createReadStream('../config/n2medchannel.block');
       console.log("orderer genesis block ", n2medOrdererGenesis);

};



