#!/bin/bash
CC_VERSION=600.50

usage() {
   echo "Usage: $0
   -o [create | up | down | restart | re-build]
   -h help"
   exit 1;
}

start() {
	sleep 10
	# Create the channel
	docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com peer channel create -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/channel.tx
	# Join peer0.org1.example.com to the channel.
	docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com peer channel join -b n2medchannel.block
	sleep 10
	docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/N2miMSPanchors.tx
	pushd ../../fabric/chaincodes/med
		npm install
		npm run build
	popd
	docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" cli peer chaincode install -n med -v $CC_VERSION -p /opt/gopath/src/github.com/med/ -l node
	docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" cli peer chaincode instantiate -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v $CC_VERSION -c '{"Args":[]}' -P "OR('N2miMSP.member')" --collections-config /opt/gopath/src/github.com/med/collection-config.json
}

while getopts "o:" OPT; do
	case "${OPT}" in
		o)
			opt="$OPTARG"
			;;
		*)
			usage
			;;
	esac
done

if [ -z $opt ]; then
	usage
elif [[ $opt == "create" ]]; then
        docker-compose -p n2mi down
	docker rm -f $(docker ps -a | grep dev-peer0 | awk '{print $1}')
        docker volume prune -f
	docker-compose -p n2mi up --build -d
	start
	docker update --restart always $(docker ps -a | grep dev-peer0 | awk '{print $1}')
elif [[ $opt == "up" ]]; then
	docker-compose -p n2mi up -d
elif [[ $opt == "down" ]]; then
	docker-compose -p n2mi down
	docker rm -f $(docker ps -a | grep dev-peer0 | awk '{print $1}')
elif [[ $opt == "restart" ]]; then
	docker-compose -p n2mi restart
elif [[ $opt == "re-build" ]]; then
	docker-compose -p n2mi up --force-recreate --build -d
	start
fi
