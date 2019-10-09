'use strict';

module.exports =  function(app) {

    const fs = require('fs');
    const exec = require('child_process').exec;
    
    // Functions webservices of n2med Backoffice Onboarding
    app.post('/receive-json', (req, res) => {

        const jsonPayload =  JSON.parse(JSON.stringify(req.body));
 
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

        //exec("docker exec cli sh -c '/etc/hyperledger/channel-artifacts/add-org-n2medchannel.sh " + orgPeerJson + ' ' + orgOrdererJson + "'");
 
        var doneAddingOrg = "true"

        res.send(doneAddingOrg);
    });

    app.post('/get-orderer-genesis', (req, res) => {

        var n2medOrdererGenesis = fs.createReadStream('../config/n2medchannel.block');
        console.log("orderer genesis block ", n2medOrdererGenesis);
 
        res.send(n2medOrdererGenesis);

    });
}