#!/bin/bash
#
# Copyright 2018 CPqD. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
CHANNEL_NAME=n2medchannel

# Create config and crypto-config if not exists
mkdir -p config/
mkdir -p crypto-config/

# remove previous crypto material and config transactions
rm -fr config/*
rm -fr crypto-config/*

# generate crypto material
cryptogen generate --config=./crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate genesis block for orderer
configtxgen -profile N2medDevOrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile N2medDevChannel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile N2medDevChannel -outputAnchorPeersUpdate ./config/N2miMSPanchors.tx -channelID $CHANNEL_NAME -asOrg N2miMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for N2miMSP..."
  exit 1
fi

# verify keys file
new_file=`ls -1 crypto-config/peerOrganizations/n2mi.n2med.com/ca/ | grep _sk`
old_file=`grep _sk docker-compose.yml | awk -F "/" '{print $5}'`

# update docker-compose file
sed -i -- "s/${old_file}/${new_file}/g" docker-compose.yml
