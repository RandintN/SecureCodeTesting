set -ev
export ORGANIZATION_NAME=Example
export ORGANIZATION_NAME_LOWERCASE=example
export PEER_NUMBER=0
export CA_ADMIN_USER=admin
export CA_ADMIN_PASSWORD=admin
export COMPANY_DOMAIN=example.com
export CA_ADDRESS_PORT=ca.$COMPANY_DOMAIN:7150
export ORDERER_ADMIN_PASSWORD=admin
export PEER_PASSWORD=admin

export ORDERER_MSP=./crypto-config/ordererOrganizations/orderers/orderer.$COMPANY_DOMAIN
export PEER_DIRECTORY=./crypto-config/peerOrganizations/peers/peer.$COMPANY_DOMAIN

export FABRIC_START_TIMEOUT=3

sudo rm -rf crypto-config/ ${ORGANIZATION_NAME}Ca/ ${ORGANIZATION_NAME_LOWERCASE}.json

docker-compose -p n2med -f docker-compose.yml up -d ca

sleep ${FABRIC_START_TIMEOUT}

./generate-org-ids.sh ${CA_ADMIN_USER} ${CA_ADMIN_PASSWORD} ${CA_ADDRESS_PORT} ${COMPANY_DOMAIN} ${ORDERER_ADMIN_PASSWORD} ${PEER_PASSWORD}

sleep ${FABRIC_START_TIMEOUT}

sudo cp -r ./${ORGANIZATION_NAME}Ca/client/crypto-config ./

sleep 1

sudo chmod -R 777 ./crypto-config

sleep 2

# Move Orderer TLS files
sudo mv $ORDERER_MSP/tls/signcerts/cert.pem $ORDERER_MSP/tls/server.crt
sudo mv $ORDERER_MSP/tls/keystore/*_sk $ORDERER_MSP/tls/server.key
sudo mv $ORDERER_MSP/tls/tlscacerts/*.pem $ORDERER_MSP/tls/ca.crt

# Move Peer TLS files
sudo mv $PEER_DIRECTORY/tls/signcerts/cert.pem $PEER_DIRECTORY/tls/server.crt
sudo mv $PEER_DIRECTORY/tls/keystore/*_sk $PEER_DIRECTORY/tls/server.key
sudo mv $PEER_DIRECTORY/tls/tlscacerts/*.pem $PEER_DIRECTORY/tls/ca.crt

sleep ${FABRIC_START_TIMEOUT}

sudo ./configtxgen -printOrg ${ORGANIZATION_NAME}MSP > ${ORGANIZATION_NAME_LOWERCASE}.json

docker-compose -p n2med -f docker-compose.yml up -d


pushd ./chaincode
npm install
npm run build
popd

docker exec -e "CORE_PEER_LOCALMSPID=ExampleMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/peer/crypto/peerOrganizations/example.com/users/Admin@example.com/msp" cli.$COMPANY_DOMAIN peer chaincode install -n med -v 508.16 -p /opt/med/ -l node

