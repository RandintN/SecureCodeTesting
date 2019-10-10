var request = require('request');
const fs = require('fs')

async function main() {

       await request.post({
              headers: {'content-type' : 'application/json'},
              url:     'http://192.168.65.89:3000/get-orderer-genesis',
            }, function(error, response, body){
              console.log(response);
              var imageBuffer = Buffer.from(response.body, 'base64');
              fs.writeFileSync('../config/n2medchannel.block', imageBuffer,);
            });
          }
  
main();