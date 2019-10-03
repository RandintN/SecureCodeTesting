'use strict';

var request = require('request');
const fs = require('fs');

exports.send_json = function (orgsJsonName) {

       var jsonFile = fs.readFileSync(orgsJsonName + '.json');
       var orgJSON = JSON.parse(jsonFile);

       request.post(
              '192.168.65.89:3000/receive-json',
              orgJSON,
              function (error, response) {
                  if (!error && response.statusCode == 200) {
                      console.log(response);
                  }
              }
       );
       console.log(org);
};

exports.request_orderer_genesis = async function () {
       // New org requests orderer genesis
       var requestOrdererGenesis = "Please give me the orderer genesis";

       await request.post(
              '192.168.65.89:3000/receive-json',
              requestOrdererGenesis,
              function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                      console.log(body);
                  }
                     var ordererGenesis = response.body;
                     fs.writeFileSync('n2medchannel.block', ordererGenesis);
                     console.log(response);
              }
       );
};



