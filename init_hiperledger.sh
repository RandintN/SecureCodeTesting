#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -p n2mi down

docker-compose -p n2mi -f docker-compose.yml up -d ca.n2med.com orderer.n2med.com peer0.n2mi.n2med.com couchdb cli

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

pushd ./fabric/chaincodes/med
npm install
npm run build
popd

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
    "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
    cli peer chaincode install -n med -v 508.16 -p /opt/gopath/src/github.com/med/ -l node

docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
    "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
    cli peer chaincode instantiate -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v 508.16 -c '{"Args":[]}' -P "OR('N2miMSP.member')" \
    --collections-config /opt/gopath/src/github.com/med/collection-config.json
