
ADD_ORG_TEMP=/etc/hyperledger/channel-artifacts
ORGANIZATION_ORDERER=$1

export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/ordererOrganizations/users/Admin@orderer.n2med.com/msp
export CORE_PEER_ADDRESS=orderer.n2med.com:7050
export CORE_PEER_LOCALMSPID=OrdererMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt


mkdir $ADD_ORG_TEMP/add-org-temp
cp $ADD_ORG_TEMP/$ORGANIZATION_ORDERER.json $ADD_ORG_TEMP/add-org-temp

pushd $ADD_ORG_TEMP/add-org-temp

echo -e "\nFetch channel config block"
peer channel fetch config config_block.pb -o orderer.n2med.com:7050 -c testchainid --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

echo -e "\nDecode config_block.pb de binário para arquivo json e limpar o HEADER do json"
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json

echo -e "\nAdicionar configuração da organização "nova" na configuração do canal"
jq -s '.[0] * {"channel_group":{"groups":{"Orderer":{"groups": {"'$ORGANIZATION_ORDERER'MSP":.[1]}}}}}' config.json $ORGANIZATION_ORDERER.json > modified_config.json

echo -e "\nCodificar a configuração do bloco no formato pb (protobuffer) para o canal intepretar"
configtxlator proto_encode --input config.json --type common.Config --output config.pb

echo -e "\nCodificar a configuração da organização no formato pb (protobuffer) para o canal intepretar"
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb

echo -e "\nCarregar os novos arquivos de configuração da organização no canal"
configtxlator compute_update --channel_id testchainid --original config.pb --updated modified_config.pb --output org_update.pb

echo -e "\nDecode org_update.pb para org_update.json"
configtxlator proto_decode --input org_update.pb --type common.ConfigUpdate | jq . > org_update.json

echo -e "\nAdicionar o Header no json em testchainid"

echo '{"payload":{"header":{"channel_header":{"channel_id":"testchainid", "type":2}},"data":{"config_update":'$(cat org_update.json)'}}}' | jq . > org_update_in_envelope.json

echo -e "\nDecode org_update_in_envelope.json para org_update_in_envelope.pb"
configtxlator proto_encode --input org_update_in_envelope.json --type common.Envelope --output org_update_in_envelope.pb

echo -e "\nAssinar novo bloco de configuração para dar permissão da organização nova na rede"
peer channel signconfigtx -f org_update_in_envelope.pb 

echo -e "\nIncluir o novo bloco de configuração da organização nova na ledger"
peer channel update -f org_update_in_envelope.pb -c testchainid -o orderer.n2med.com:7050 --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

#rm -rf /etc/hyperledger/channel-artifacts/add-org-temp

popd