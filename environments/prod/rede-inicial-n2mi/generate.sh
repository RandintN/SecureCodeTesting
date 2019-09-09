export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
CHANNEL_NAME=n2medchannel

# Create config and crypto-config if not exists
mkdir -p config/

# remove previous crypto material and config transactions
rm -fr config/*

# generate genesis block for orderer
configtxgen -profile OrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile Channel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile Channel -outputAnchorPeersUpdate ./config/N2miMSPanchors.tx -channelID $CHANNEL_NAME -asOrg N2miMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for N2miMSP..."
  exit 1
fi