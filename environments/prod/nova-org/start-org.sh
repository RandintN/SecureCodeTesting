set -ev
# Section 1: Organization information
export ORGANIZATION_NAME=Alphamed
export ORGANIZATION_NAME_LOWERCASE=alphamed
export ORDERER_NAME=AlphamedOrderer
export PEER_NUMBER=0
export COMPANY_DOMAIN=alphamed.com

# Section 2: Intermediate CA variables
export CA_ADMIN_USER=admin
export CA_ADMIN_PASSWORD=admin
export CA_ADDRESS_PORT=ca.$COMPANY_DOMAIN:7150
export ORDERER_ADMIN_PASSWORD=admin
export PEER_PASSWORD=admin

# Section 3: Ip Address Section
export IP_ADDRESS=192.168.68.133
export HOST_CA=192.168.65.89:7054
export N2MED_ORDERER_IP=192.168.65.89

export FABRIC_CFG_PATH=${PWD}

export ORDERER_MSP=./crypto-config/ordererOrganizations/orderers/orderer.$COMPANY_DOMAIN
export PEER_DIRECTORY=./crypto-config/peerOrganizations/peers/peer0.$COMPANY_DOMAIN

# Timeout variable  
export FABRIC_START_TIMEOUT=3

 CONTAINER_IDS=$(docker ps -aq)
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi

sudo rm -rf crypto-config/ ${ORGANIZATION_NAME}Ca/ ${ORGANIZATION_NAME_LOWERCASE}.json ./config/*

docker-compose -p n2med -f docker-compose.yml up -d ca

sleep ${FABRIC_START_TIMEOUT}

./generate-org-ids.sh ${CA_ADMIN_USER} ${CA_ADMIN_PASSWORD} ${CA_ADDRESS_PORT} ${COMPANY_DOMAIN} ${ORDERER_ADMIN_PASSWORD} ${PEER_PASSWORD} ${IP_ADDRESS}

sleep ${FABRIC_START_TIMEOUT}

sudo cp -r ./${ORGANIZATION_NAME}Ca/client/crypto-config ./
sudo cp ./tls-certificates/server.crt ./config
sudo cp ./tls-certificates/medcc.pak ./config

sleep 1

sudo chmod -R 777 ./crypto-config

sleep 2

# Move Orderer TLS files
sudo mv $ORDERER_MSP/tls/signcerts/cert.pem $ORDERER_MSP/tls/server.crt
sudo mv $ORDERER_MSP/tls/keystore/*_sk $ORDERER_MSP/tls/server.key
sudo mv $ORDERER_MSP/tls/tlsintermediatecerts/*.pem $ORDERER_MSP/tls/ca.crt

# Move Peer TLS files
sudo mv $PEER_DIRECTORY/tls/signcerts/cert.pem $PEER_DIRECTORY/tls/server.crt
sudo mv $PEER_DIRECTORY/tls/keystore/*_sk $PEER_DIRECTORY/tls/server.key
sudo mv $PEER_DIRECTORY/tls/tlsintermediatecerts/*.pem $PEER_DIRECTORY/tls/ca.crt

# Delete empty TLS directories
sudo rm -rf $ORDERER_MSP/tls/{cacerts,keystore,signcerts,tlscacerts,user}
sudo rm -rf $PEER_DIRECTORY/tls/{cacerts,keystore,signcerts,tlscacerts,user}

sudo cp ./${ORGANIZATION_NAME}Ca/ca-chain.pem $ORDERER_MSP/tls

sleep ${FABRIC_START_TIMEOUT}

sudo ./generate.sh

sudo ./configtxgen -printOrg ${ORGANIZATION_NAME}MSP > ${ORGANIZATION_NAME}.json
sudo ./configtxgen -printOrg ${ORDERER_NAME}MSP > ${ORDERER_NAME}.json

docker-compose -p n2med -f docker-compose.yml up -d  peer cli couchdb

sleep 5

docker exec cli.${COMPANY_DOMAIN} peer chaincode install /etc/hyperledger/configtx/medcc.pak

# docker exec cli.alphamed.com peer channel fetch 0 n2medchannel.block -o 192.168.65.89:7050 -c n2medchannel --tls --cafile /etc/hyperledger/configtx/server.crt
 
# docker exec cli.alphamed.com peer channel join -b n2medchannel.block

# docker exec cli.alphamed.com peer channel update -o orderer.alphamed.com:7050 --tls --cafile /etc/hyperledger/crypto-config/ordererOrganizations/orderers/orderer.alphamed.com/tls/ca.crt -c n2medchannel -f /etc/hyperledger/configtx/AlphamedMSPanchors.tx


# docker exec cli.example.com peer chaincode invoke -o orderer.alphamed.com:7050 --tls --cafile /etc/hyperledger/crypto-config/ordererOrganizations/orderers/orderer.alphamed.com/tls/server.crt -C n2medchannel -n med -c '{"Args":["invoke","a","b","10"]}'


# peer chaincode invoke -o orderer.example.com:7050 --tls --cafile /etc/hyperledger/crypto-config/ordererOrganizations/orderers/orderer.example.com/tls/ca.crt -C n2medchannel -n med -c '{"Args":["addMedicineRequest","{\"amount\":\"23\", \"type\":\"donation\",\"medicine\":{\"active_ingredient\":\"AGUA\", \"pharma_form\":\"Xarope\", \"pharma_industry\":[\"3M\"],\"concentration\":\"33\", \"classification\":[\"Similar\"]},\"id\":\"13\" }"]}'


docker exec cli.alphamed.com peer channel fetch config testchainid.block -o 192.168.65.89:7050 -c testchainid --tls --cafile /etc/hyperledger/configtx/server.crt