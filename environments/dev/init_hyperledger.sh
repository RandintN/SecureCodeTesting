#! /bin/bash

CC_VERSION=600.50

if `docker network inspect n2mi_n2med > /dev/null 2>&1` ; then
    echo "Network n2mi_n2med already exists"
else
    echo "Creating network n2mi_n2med ..."
    docker network create n2mi_n2med
fi

docker-compose -p n2mi down

docker-compose -p n2mi up --build -d

sleep 10

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
    peer channel create -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/channel.tx
# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
    peer channel join -b n2medchannel.block

sleep ${FABRIC_START_TIMEOUT}

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
    peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/N2miMSPanchors.tx

pushd ../../fabric/chaincodes/med
npm install
npm run build
popd

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
    "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
    cli peer chaincode install -n med -v $CC_VERSION -p /opt/gopath/src/github.com/med/ -l node

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
    "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
    cli peer chaincode instantiate -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v $CC_VERSION -c '{"Args":[]}' -P "OR('N2miMSP.member')" \
    --collections-config /opt/gopath/src/github.com/med/collection-config.json
