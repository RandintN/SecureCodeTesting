export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
CHANNEL_NAME=n2medchannel

# Create config and crypto-config if not exists
mkdir -p config/

# generate genesis block for orderer
configtxgen -profile OrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile N2medChannel -outputAnchorPeersUpdate ./config/N2miMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ExampleMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for N2miMSP..."
  exit 1
fi