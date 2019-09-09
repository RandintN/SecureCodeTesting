npm install && npm run build && export CC_VERSION=130.2 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
        cli peer chaincode install -n med -v $CC_VERSION -p /opt/gopath/src/github.com/med/ -l node && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e  "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
        cli peer chaincode upgrade -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v $CC_VERSION -c '{"Args":[]}' -P "OR('N2miMSP.member')" --collections-config /opt/gopath/src/github.com/med/collection-config.json && \
sleep 5 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addActiveIngredient","Args":["{\"name\":\"test\", \"special\":false}"]}' && \
sleep 3 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addMedicineClassification","Args":["{\"category\": \"test\", \"situation\": \"ACTIVE\"}"]}' && \
sleep 3 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addPharmaceuticalForm","Args":["{\"pharma_form\": \"test\", \"situation\": \"ACTIVE\"}"]}' && \
sleep 3 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addPharmaceuticalIndustry","Args":["{\"pharmaceutical_laboratory\": \"test\", \"situation\": \"ACTIVE\"}"]}' && \
sleep 3 && \
docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addNegotiationModality","Args":["{\"modality\": \"test\", \"situation\": \"ACTIVE\"}"]}'
