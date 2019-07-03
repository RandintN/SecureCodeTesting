#!/bin/bash

usage() { echo "Usage: $0
-o <Organization>
-h help"
 exit 1;
}

while getopts "o:" OPT; do
    case "${OPT}" in
        o)
            org=${OPTARG}
            ;;
        h)
            usage
            ;;
        *)
            usage
            ;;
    esac
done

shift $((OPTIND-1))

if [ -z "${org}" ]; then
    usage
fi

echo -e "\nCopiando arquivo .json para container cli"
cp org_$org/org_$org.json  ~/core-hyperledger/environments/certificates/config

name_channel="n2medchannel"

echo -e "\nFetch channel config block"
docker exec cli peer channel fetch config config_block.pb -o orderer.n2med.com:7050 -c $name_channel


echo -e "\nDecode config_block.pb de binário para arquivo json e limpar o HEADER do json"
docker exec cli bash -c "configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > /opt/gopath/src/github.com/hyperledger/fabric/peer/config.json"

echo -e "\nAdicionar configuração da organização "nova" na configuração do canal"
docker exec cli jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'$org'MSP":.[1]}}}}}' config.json /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/org_$org.json > modified_config.json

echo -e "\nCodificar a configuração do bloco no formato pb (protobuffer) para o canal intepretar"
docker exec cli configtxlator proto_encode --input config.json --type common.Config --output config.pb

echo -e "\nCodificar a configuração da organização no formato pb (protobuffer) para o canal intepretar"
docker exec cli configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb

echo -e "\nCarregar os novos arquivos de configuração da organização no canal"
docker exec cli configtxlator compute_update --channel_id $name_channel --original config.pb --updated modified_config.pb --output org_update.pb

echo -e "\nDecode org_update.pb para org_update.json"
docker exec cli bash -c 'configtxlator proto_decode --input org_update.pb --type common.ConfigUpdate | jq . > org_update.json'

echo -e "\nAdicionar o Header no json em n2medchannel"
#ERROR AUTOMATIC
docker exec cli bash -c 'echo '{"payload":{"header":{"channel_header":{"channel_id":"n2medchannel", "type":2}},"data":{"config_update":'$(cat org_update.json)'}}}' | jq . > org_update_in_envelope.json'

echo -e "\nDecode org_update_in_envelope.json para org_update_in_envelope.pb"
docker exec cli configtxlator proto_encode --input org_update_in_envelope.json --type common.Envelope --output org_update_in_envelope.pb

echo -e "\nAssinar novo bloco de configuração para dar permissão da organização nova na rede"
docker exec cli peer channel signconfigtx -f org_update_in_envelope.pb

echo -e "\nIncluir o novo bloco de configuração da organização nova na ledger"
docker exec cli peer channel update -f org_update_in_envelope.pb -c $name_channel -o orderer.n2med.com:7050
