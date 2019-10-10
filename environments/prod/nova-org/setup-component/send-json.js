var request = require('request');
const fs = require('fs')

async function main() {

  const orgsJson = process.argv[2];
  const ordererJson = process.argv[3];
  const IP_ADDRESS = process.argv[4]

  var orgJson = fs.readFileSync('artifacts/' + orgsJson + '.json');
  var orgJSON = JSON.parse(orgJson);

  var jsonFile = fs.readFileSync('artifacts/' + ordererJson + '.json');
  var ordererJSON = JSON.parse(jsonFile);

  var tlsCert = fs.readFileSync('artifacts/server.crt').toString();
  
  var jsonArtifacts = {
      orgName: orgsJson,
      ordererName: ordererJson,
      org: orgJSON,
      orderer: ordererJSON,
      tls: tlsCert
  }
  console.log("JSON", jsonArtifacts);

  request.post({
      headers: {'content-type' : 'application/json'},
      url:     'http://' + IP_ADDRESS + ':3000/receive-json',
      body:    JSON.stringify(jsonArtifacts)
    }, function(error, response, body){
      console.log(response.body);
    });
  }

main();