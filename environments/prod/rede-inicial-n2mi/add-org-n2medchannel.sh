
ADD_ORG_TEMP=/etc/hyperledger/channel-artifacts

# Parameters
ORGANIZATION_ORDERER=$1
ORGANIZATION_MSP=$2

##################
# System Channel #
##################

export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/ordererOrganizations/users/Admin@orderer.n2med.com/msp
export CORE_PEER_ADDRESS=orderer.n2med.com:7050
export CORE_PEER_LOCALMSPID=OrdererMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

mkdir $ADD_ORG_TEMP/system-temp
cp $ADD_ORG_TEMP/AlphamedOrderer.json $ADD_ORG_TEMP/system-temp
cp $ADD_ORG_TEMP/Alphamed.json $ADD_ORG_TEMP/system-temp
cp server.crt $ADD_ORG_TEMP/system-temp

pushd $ADD_ORG_TEMP/system-temp

echo -e "\nFetch channel config block"
peer channel fetch config config_block.pb -o orderer.n2med.com:7050 -c n2med-system-channel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json

# Add to organization channel group
jq -s '.[0] * {"channel_group":{"groups":{"Orderer":{"groups": {"'$ORGANIZATION_ORDERER'MSP":.[1]}}}}}' config.json $ORGANIZATION_ORDERER.json > modified_config.json

# Add orderer address to addresses list
jq ".channel_group.values.OrdererAddresses.value.addresses += [\"192.168.68.133:7050\"]" modified_config.json > modified_config1.json

# Add new Org MSP to Consortium channel group
jq -s ".[0] * {\"channel_group\":{\"groups\":{\"Consortiums\":{\"groups\":{\"N2medConsortium\":{\"groups\": {\"AlphamedMSP\":.[1]}}}}}}}" modified_config1.json $ORGANIZATION_MSP.json > modified_config2.json

# Add to consenters list
export FLAG=$(if [ "$(uname -s)" == "Linux" ]; then echo "-w 0"; else echo "-b 0"; fi)

TLS_FILE=server.crt
echo "{\"client_tls_cert\":\"$(cat $TLS_FILE | base64 $FLAG)\",\"host\":\"192.168.68.133\",\"port\":7050,\"server_tls_cert\":\"$(cat $TLS_FILE | base64 $FLAG)\"}" > $PWD/new-consenter.json

jq ".channel_group.groups.Orderer.values.ConsensusType.value.metadata.consenters += [$(cat new-consenter.json)]" modified_config2.json > modified_config_final.json

configtxlator proto_encode --input config.json --type common.Config --output config.pb

configtxlator proto_encode --input modified_config_final.json --type common.Config --output modified_config.pb

configtxlator compute_update --channel_id n2med-system-channel --original config.pb --updated modified_config.pb --output org_update.pb

configtxlator proto_decode --input org_update.pb --type common.ConfigUpdate | jq . > org_update.json

echo '{"payload":{"header":{"channel_header":{"channel_id":"n2med-system-channel", "type":2}},"data":{"config_update":'$(cat org_update.json)'}}}' | jq . > org_update_in_envelope.json

configtxlator proto_encode --input org_update_in_envelope.json --type common.Envelope --output org_update_in_envelope.pb

peer channel signconfigtx -f org_update_in_envelope.pb 

peer channel update -f org_update_in_envelope.pb -c n2med-system-channel -o orderer.n2med.com:7050 --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

sleep 5

popd

#######################
# Application Channel #
#######################

export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/ordererOrganizations/users/Admin@orderer.n2med.com/msp
export CORE_PEER_ADDRESS=peer0.n2med.com:7050
export CORE_PEER_LOCALMSPID=OrdererMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

mkdir $ADD_ORG_TEMP/application-temp
cp $ADD_ORG_TEMP/AlphamedOrderer.json $ADD_ORG_TEMP/application-temp
cp $ADD_ORG_TEMP/Alphamed.json $ADD_ORG_TEMP/application-temp
cp server.crt $ADD_ORG_TEMP/application-temp

pushd $ADD_ORG_TEMP/application-temp

echo -e "\nFetch channel config block"
peer channel fetch config config_block.pb -o orderer.n2med.com:7050 -c n2medchannel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json

# Add to organization channel group
jq -s '.[0] * {"channel_group":{"groups":{"Orderer":{"groups": {"'$ORGANIZATION_ORDERER'MSP":.[1]}}}}}' config.json $ORGANIZATION_ORDERER.json > modified_config.json

# Add orderer address to addresses list
jq ".channel_group.values.OrdererAddresses.value.addresses += [\"192.168.68.133:7050\"]" modified_config.json > modified_config1.json

# Add new Org MSP to Application channel group
jq -s ".[0] * {\"channel_group\":{\"groups\":{\"Application\":{\"groups\": {\"AlphamedMSP\":.[1]}}}}}" modified_config1.json $ORGANIZATION_MSP.json > modified_config2.json

# Add to consenters list
export FLAG=$(if [ "$(uname -s)" == "Linux" ]; then echo "-w 0"; else echo "-b 0"; fi)

TLS_FILE=server.crt
echo "{\"client_tls_cert\":\"$(cat $TLS_FILE | base64 $FLAG)\",\"host\":\"192.168.68.133\",\"port\":7050,\"server_tls_cert\":\"$(cat $TLS_FILE | base64 $FLAG)\"}" > $PWD/new-consenter.json

jq ".channel_group.groups.Orderer.values.ConsensusType.value.metadata.consenters += [$(cat new-consenter.json)]" modified_config2.json > modified_config_final.json

configtxlator proto_encode --input config.json --type common.Config --output config.pb

configtxlator proto_encode --input modified_config_final.json --type common.Config --output modified_config.pb

configtxlator compute_update --channel_id n2medchannel --original config.pb --updated modified_config.pb --output org_update.pb

configtxlator proto_decode --input org_update.pb --type common.ConfigUpdate | jq . > org_update.json

echo '{"payload":{"header":{"channel_header":{"channel_id":"n2medchannel", "type":2}},"data":{"config_update":'$(cat org_update.json)'}}}' | jq . > org_update_in_envelope.json

configtxlator proto_encode --input org_update_in_envelope.json --type common.Envelope --output org_update_in_envelope.pb

peer channel signconfigtx -f org_update_in_envelope.pb

sleep 10

peer channel update -f org_update_in_envelope.pb -c n2medchannel -o orderer.n2med.com:7050 --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt

# rm -rf /etc/hyperledger/channel-artifacts/add-org-temp

popd


export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp
export CORE_PEER_ADDRESS=peer0.n2med.com:7051
export CORE_PEER_LOCALMSPID=N2miMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/peerOrganizations/peers/peer0.n2med.com/tls/ca.crt
