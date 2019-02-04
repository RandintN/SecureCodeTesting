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

docker-compose -f docker-compose.yml down

docker-compose -f docker-compose.yml up -d orderer.n2med.com peer0.n2mi.n2med.com couchdb cli ca.n2med.com 

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com peer channel create -o orderer.n2med.com:7050 -c n2med-channel -f /etc/hyperledger/configtx/channel.tx
# Join peer0.n2mi.n2med.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com peer channel join -b n2med-channel.block

# # Install Chaincode
# docker exec cli peer chaincode install -n utilityToken -l node -v 100.0 -p /opt/gopath/src/github.com/utilityToken/node/ 

# # Instantiate Chaincode
# docker exec cli peer chaincode instantiate -o orderer.n2med.com:7050 -C sch-channel -n utilityToken -v 100.0 -c '{"Args":[""]}'

#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}
