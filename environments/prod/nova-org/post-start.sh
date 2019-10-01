# Run script after N2med has been included in the channel

# Section 1: Organization information
export ORGANIZATION_NAME=Alphamed
export ORGANIZATION_NAME_LOWERCASE=alphamed
export ORDERER_NAME=AlphamedOrderer
export PEER_NUMBER=0
export COMPANY_DOMAIN=alphamed.com
export N2MED_ORDERER_IP=192.168.65.89

# Join peer to the channel.
docker exec cli.$COMPANY_DOMAIN peer channel fetch 0 n2medchannel.block -o $N2MED_ORDERER_IP:7050 -c n2medchannel --tls --cafile /etc/hyperledger/configtx/server.crt

docker exec cli.$COMPANY_DOMAIN peer channel join -b n2medchannel.block

docker-compose -p n2med -f docker-compose.yml up -d orderer

# docker exec cli.$COMPANY_DOMAIN peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/ExampleMSPanchors.tx