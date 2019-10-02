'use strict';

var request = require('request');
const fs = require('fs');

exports.send_json = function (orgsJsonName) {

       

       var jsonFile = fs.readFileSync(orgsJsonName + '.json');
       var orgJSON = JSON.parse(jsonFile);

       request.post(
              '192.168.68.133:3000/receive-json',
              orgJSON,
              function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                      console.log(body);
                  }
              }
       );
       console.log(org);
};

exports.request_orderer_genesis = async function (response) {
       // New org requests orderer genesis
       var requestOrdererGenesis = "Please give me the orderer genesis";

       await request.post(
              '192.168.68.133:3000/receive-json',
              requestOrdererGenesis,
              function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                      console.log(body);
                  }
              }
       );
       console.log(response);

};

exports.receive_orderer_genesis_new_org = function (ordererGenesis) {
       // http request orderer from send_orderer_genesis_to_new_org
       // copy orderer genesis to nova-org/config
       //execute script docker-compose up -d orderer

       fs.writeFileSync('n2medchannel.block', ordererGenesis);

};



