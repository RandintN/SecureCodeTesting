#set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
export FABRIC_START_TIMEOUT=4

export ORDERER_MSP=./crypto-config/ordererOrganizations/orderers/orderer.n2med.com
export PEER_DIRECTORY=./crypto-config/peerOrganizations/peers/peer0.n2med.com

  CONTAINER_IDS=$(docker ps -aq)
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi

sudo rm -rf crypto-config/ n2medCa/ config/*

docker-compose -f docker-compose.yml down

sleep ${FABRIC_START_TIMEOUT}

docker-compose -p n2mi -f docker-compose.yml up -d rca.n2med

sleep ${FABRIC_START_TIMEOUT}

./generate-node-certificates.sh rca.n2med.com:7054 n2med.com

sleep ${FABRIC_START_TIMEOUT}

sudo mv ./n2medCa/client/crypto-config ./

sleep 1

sudo chmod -R 777 ./crypto-config

sleep 2

sudo cp -r $ORDERER_MSP/tls/tlscacerts ./crypto-config/ordererOrganizations/msp
sudo cp -r $PEER_DIRECTORY/tls/tlscacerts ./crypto-config/peerOrganizations/msp

# Move Orderer TLS files
sudo mv $ORDERER_MSP/tls/signcerts/cert.pem $ORDERER_MSP/tls/server.crt
sudo mv $ORDERER_MSP/tls/keystore/*_sk $ORDERER_MSP/tls/server.key
sudo mv $ORDERER_MSP/tls/tlscacerts/*.pem $ORDERER_MSP/tls/ca.crt

# Move Peer TLS files
sudo mv $PEER_DIRECTORY/tls/signcerts/cert.pem $PEER_DIRECTORY/tls/server.crt
sudo mv $PEER_DIRECTORY/tls/keystore/*_sk $PEER_DIRECTORY/tls/server.key
sudo mv $PEER_DIRECTORY/tls/tlscacerts/*.pem $PEER_DIRECTORY/tls/ca.crt

# Delete empty TLS directories
sudo rm -rf $ORDERER_MSP/tls/{cacerts,keystore,signcerts,tlscacerts,user}
sudo rm -rf $PEER_DIRECTORY/tls/{cacerts,keystore,signcerts,tlscacerts,user}

sudo ./generate.sh

sudo cp add-org-channel.sh ./config

sleep ${FABRIC_START_TIMEOUT}

docker-compose -p n2mi -f docker-compose.yml up -d orderer.n2med.com peer0.n2med.com cli couchdb

sleep ${FABRIC_START_TIMEOUT}

# Create the channel 
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer channel create -o orderer.n2med.com:7050 -c n2medchannel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt -f /etc/hyperledger/channel-artifacts/channel.tx

sleep 3

# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer channel join -b n2medchannel.block 

sleep ${FABRIC_START_TIMEOUT}

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer channel update -o orderer.n2med.com:7050 --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt -c n2medchannel -f /etc/hyperledger/channel-artifacts/N2miMSPanchors.tx

pushd ../../../fabric/chaincodes/med
npm install
npm run build
popd

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer chaincode install -n med -v 1 -p /opt/med/ -l node

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer chaincode instantiate -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v 1 -c '{"Args":[]}' -P "OR('N2miMSP.member')" --collections-config /opt/med/collection-config.json --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt