CA_ADDRESS_PORT=$1
COMPANY_DOMAIN=$2
USER_NAME=$3
USER_PASSWORD=$4

export PEER_DIRECTORY=/etc/hyperledger/fabric-ca/

docker exec rca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name $USER_NAME@peer0.$COMPANY_DOMAIN --id.secret $USER_PASSWORD --id.type user -u https://$CA_ADDRESS_PORT

docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://$USER_NAME@peer0.$COMPANY_DOMAIN:$USER_PASSWORD@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$PEER_DIRECTORY/users/$USER_NAME@peer0.$COMPANY_DOMAIN/msp

sudo chmod -R 777 ./n2medCa/users/
mkdir -p users
sudo mv ./n2medCa/users/$USER_NAME@peer0.$COMPANY_DOMAIN ./users

#./register-user.sh rca.n2med.com:7054 n2med.com UserNickk nickpw