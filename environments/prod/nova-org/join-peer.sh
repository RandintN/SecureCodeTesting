
# Join peer to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
    peer channel join -b n2medchannel.block

sleep ${FABRIC_START_TIMEOUT}

docker exec -e "CORE_PEER_LOCALMSPID=ExampleMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@example.com/msp" peer0.example.com peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/ExampleMSPanchors.tx