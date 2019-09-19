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
export IP_ADDRESS=192.168.68.133
export HOST_CA=192.168.65.89:7054
export N2MED_ORDERER_IP=192.168.65.89

export FABRIC_CFG_PATH=${PWD}

export ORDERER_MSP=./crypto-config/ordererOrganizations/orderers/orderer.$COMPANY_DOMAIN
export PEER_DIRECTORY=./crypto-config/peerOrganizations/peers/peer0.$COMPANY_DOMAIN

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

sudo ./configtxgen -printOrg ${ORGANIZATION_NAME}MSP > ${ORGANIZATION_NAME_LOWERCASE}.json

docker-compose -p n2med -f docker-compose.yml up -d

pushd ../../../fabric/chaincodes/med
npm install
npm run build
popd

docker exec cli.$COMPANY_DOMAIN peer chaincode install -n med -v 1 -p /etc/hyperledger/chaincode/med/ -l node --certfile /etc/hyperledger/crypto-config/peerOrganizations/peers/peer0.alphamed.com/tls/ca.crt

# Join peer to the channel.
# docker exec cli.$COMPANY_DOMAIN peer channel fetch 0 n2medchannel.block -o $N2MED_ORDERER_IP:7050 -c n2medchannel --tls --cafile /etc/hyperledger/configtx/server.crt

# docker exec cli.$COMPANY_DOMAIN peer channel join -b n2medchannel.block

#docker exec cli.$COMPANY_DOMAIN peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/ExampleMSPanchors.tx

# docker exec cli.example.com peer channel fetch 0 n2medchannel.block -o 192.168.65.89:7050 -c n2medchannel --tls --cafile /etc/hyperledger/configtx/server.crt
 
# docker exec cli.example.com peer channel join -b n2medchannel.block

# peer chaincode invoke -o 192.168.65.89:7050 --tls $CORE_PEER_TLS_ENABLED --cafile /etc/hyperledger/configtx/server.crt -C n2medchannel -n med -c '{"Args":["invoke","a","b","10"]}'