#set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
export FABRIC_START_TIMEOUT=5

export ORDERER_MSP=./crypto-config/ordererOrganizations/orderers
export PEER_DIRECTORY=./crypto-config/peerOrganizations/peers/peer0.n2med.com

export CA_ADDRESS_PORT=rca.n2med.com:7054
export COMAPNY_DOMAIN=n2med.com
export IP_ADDRESS=192.168.65.89

CONTAINER_IDS=$(docker ps -aq)
if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
  echo "---- No containers available for deletion ----"
else
  docker rm -f $CONTAINER_IDS
fi

sudo rm -rf crypto-config/ n2medCa/ config/* artifacts/*

docker-compose -f docker-compose.yml down

sleep ${FABRIC_START_TIMEOUT}

docker-compose -p n2mi -f docker-compose.yml up -d rca.n2med

sleep ${FABRIC_START_TIMEOUT}

./generate-node-certificates.sh $CA_ADDRESS_PORT $COMAPNY_DOMAIN $IP_ADDRESS

sleep ${FABRIC_START_TIMEOUT}

sudo mv ./n2medCa/client/crypto-config ./

sleep 1

sudo chmod -R 777 ./crypto-config

sleep 2

sudo cp -r $ORDERER_MSP/orderer.n2med.com/tls/tlscacerts ./crypto-config/ordererOrganizations/msp
sudo cp -r $PEER_DIRECTORY/tls/tlscacerts ./crypto-config/peerOrganizations/msp

# Move Orderer TLS files
# Orderer 1
sudo mv $ORDERER_MSP/orderer.n2med.com/tls/signcerts/cert.pem $ORDERER_MSP/orderer.n2med.com/tls/server.crt
sudo mv $ORDERER_MSP/orderer.n2med.com/tls/keystore/*_sk $ORDERER_MSP/orderer.n2med.com/tls/server.key
sudo mv $ORDERER_MSP/orderer.n2med.com/tls/tlscacerts/*.pem $ORDERER_MSP/orderer.n2med.com/tls/ca.crt
# Orderer 2
sudo mv $ORDERER_MSP/orderer2.n2med.com/tls/signcerts/cert.pem $ORDERER_MSP/orderer2.n2med.com/tls/server.crt
sudo mv $ORDERER_MSP/orderer2.n2med.com/tls/keystore/*_sk $ORDERER_MSP/orderer2.n2med.com/tls/server.key
sudo mv $ORDERER_MSP/orderer2.n2med.com/tls/tlscacerts/*.pem $ORDERER_MSP/orderer2.n2med.com/tls/ca.crt
# Orderer 3
sudo mv $ORDERER_MSP/orderer3.n2med.com/tls/signcerts/cert.pem $ORDERER_MSP/orderer3.n2med.com/tls/server.crt
sudo mv $ORDERER_MSP/orderer3.n2med.com/tls/keystore/*_sk $ORDERER_MSP/orderer3.n2med.com/tls/server.key
sudo mv $ORDERER_MSP/orderer3.n2med.com/tls/tlscacerts/*.pem $ORDERER_MSP/orderer3.n2med.com/tls/ca.crt


# Move Peer TLS files
sudo mv $PEER_DIRECTORY/tls/signcerts/cert.pem $PEER_DIRECTORY/tls/server.crt
sudo mv $PEER_DIRECTORY/tls/keystore/*_sk $PEER_DIRECTORY/tls/server.key
sudo mv $PEER_DIRECTORY/tls/tlscacerts/*.pem $PEER_DIRECTORY/tls/ca.crt

# Delete empty TLS directories
sudo rm -rf $ORDERER_MSP/orderer.n2med.com/tls/{cacerts,keystore,signcerts,tlscacerts,user}
sudo rm -rf $ORDERER_MSP/orderer2.n2med.com/tls/{cacerts,keystore,signcerts,tlscacerts,user}
sudo rm -rf $ORDERER_MSP/orderer3.n2med.com/tls/{cacerts,keystore,signcerts,tlscacerts,user}
sudo rm -rf $PEER_DIRECTORY/tls/{cacerts,keystore,signcerts,tlscacerts,user}

sudo ./generate.sh

sudo cp add-org-n2medchannel.sh ./config

sleep ${FABRIC_START_TIMEOUT}

docker-compose -p n2mi -f docker-compose.yml up -d peer0.n2med.com cli couchdb

docker-compose -p n2mi -f docker-compose.yml up -d orderer.n2med.com 
docker-compose -p n2mi -f docker-compose.yml up -d orderer2.n2med.com 
docker-compose -p n2mi -f docker-compose.yml up -d orderer3.n2med.com 
sleep 7

# Create the channel
docker exec cli peer channel create -o orderer2.n2med.com:7060 -c n2medchannel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer2.n2med.com/tls/ca.crt -f /etc/hyperledger/channel-artifacts/channel.tx

docker exec cli peer channel create -o orderer.n2med.com:7050 -c n2medchannel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt -f /etc/hyperledger/channel-artifacts/channel.tx
sleep 3

# Join peer0.org1.example.com to the channel.
docker exec cli peer channel join -b n2medchannel.block 

sleep ${FABRIC_START_TIMEOUT}

docker exec cli peer channel update -o orderer2.n2med.com:7060 -c n2medchannel --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer2.n2med.com/tls/ca.crt -f /etc/hyperledger/channel-artifacts/N2miMSPanchors.tx

pushd ../../../fabric/chaincodes/med
npm install
npm run build
popd

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer chaincode install -n med -v 1 -p /opt/med/ -l node

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp" cli peer chaincode instantiate -o orderer2.n2med.com:7060 -C n2medchannel -n med -l node -v 1 -c '{"Args":[]}' -P "OR('N2miMSP.member')" --collections-config /opt/med/collection-config.json --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer2.n2med.com/tls/ca.crt

docker exec cli peer chaincode package -n med -p /opt/med -v 1 medcc.pak -l node
sudo chmod -R 777 ./crypto-config/medcc.pak
sudo chmod -R 777 ./n2medCa

cp ./n2medCa/tls-cert.pem ./artifacts
cp ./crypto-config/medcc.pak ./artifacts
cp ./crypto-config/ordererOrganizations/orderers/orderer.n2med.com/tls/server.crt ./artifacts




export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/peerOrganizations/users/Admin@peer0.n2med.com/msp
export CORE_PEER_ADDRESS=peer0.n2med.com:7050
export CORE_PEER_LOCALMSPID=N2miMSP
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/peerOrganizations/peers/peer0.n2med.com/tls/ca.crt


#peer chaincode invoke -o orderer.n2med.com:7050  --tls --cafile /etc/hyperledger/ordererOrganizations/orderers/orderer.n2med.com/tls/ca.crt -C n2medchannel -n med -c '{"Args":["addMedicineRequest","{\"amount\":\"23\", \"type\":\"donation\",\"medicine\":{\"active_ingredient\":\"AGUA\", \"pharma_form\":\"Xarope\", \"pharma_industry\":[\"3M\"],\"concentration\":\"33\", \"classification\":[\"Similar\"]},\"id\":\"13\" }"]}'
