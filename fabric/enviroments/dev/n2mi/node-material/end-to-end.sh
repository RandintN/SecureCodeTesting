
#Start dev enviroment
. ./start.sh

#Creates set of ref tables
sleep 5

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
    cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addActiveIngredient","Args":["{\"name\":\"test\", \"special\":false}"]}'

sleep 3

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
    cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addMedicineClassification","Args":["{\"category\": \"test\", \"situation\": \"ACTIVE\"}"]}'

sleep 3

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
    cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addPharmaceuticalForm","Args":["{\"pharma_form\": \"test\", \"situation\": \"ACTIVE\"}"]}'

sleep 3

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addPharmaceuticalIndustry","Args":["{\"pharmaceutical_laboratory\": \"test\", \"situation\": \"ACTIVE\"}"]}'

sleep 3

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addNegotiationModality","Args":["{\"modality\": \"test\", \"situation\": \"ACTIVE\"}"]}'

sleep 3

docker exec \
    -e "CORE_PEER_LOCALMSPID=N2miMSP" \
    -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/User1@n2mi.n2med.com/msp" \
        cli peer chaincode invoke -o orderer.n2med.com:7050 -C n2medchannel -n med -c '{"function":"addMedicineRequest","Args":["{\"amount\":1.0,\"medicine\":{\"active_ingredient\":\"test\",\"comercial_name\":\"test\",\"pharma_form\":\"test\",\"concentration\":\"test\",\"classification\":[\"test\"],\"pharma_industry\":[\"test\"]},\"type\":\"exchange\",\"return_date\":\"2019-12-12\",\"exchange\":[{\"amount\":1.0,\"medicine\":{\"active_ingredient\":\"test\",\"comercial_name\":\"test\",\"pharma_form\":\"test\",\"concentration\":\"test\",\"pharma_industry\":\"test\",\"classification\":\"test\",\"ref_value\":0.01,\"medicine_batch\":[{\"batch\":null,\"expire_date\":\"2019-12-12\",\"amount\":1.0}]}}]}"]}'

. ./clean-all.sh
