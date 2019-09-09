
# Arguments
CA_ADMIN_USER=$1
CA_ADMIN_PASSWORD=$2
CA_ADDRESS_PORT=$3
COMPANY_DOMAIN=$4
ORDERER_ADMIN_PASSWORD=$5
PEER_PASSWORD=$6


# Directories
NODE_DIRECTORY=/etc/hyperledger/fabric-ca-client
ORDERER_MSP=crypto-config/ordererOrganizations
PEER_DIRECTORY=crypto-config/peerOrganizations

# Enroll CA Admin
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://$CA_ADMIN_USER:$CA_ADMIN_PASSWORD@$CA_ADDRESS_PORT
# Rename Key file to key.pem
docker exec ca.$COMPANY_DOMAIN sh -c 'mv /etc/hyperledger/fabric-ca-server/msp/keystore/*_sk /etc/hyperledger/fabric-ca-server/msp/keystore/key.pem'

sleep 3

######################################
#               PEER                 #
######################################

# Register peer identities with the CA
docker exec ca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name peer0.$COMPANY_DOMAIN --id.secret peerpw --id.type peer -u https://$CA_ADDRESS_PORT

docker exec ca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name Admin@peer0.$COMPANY_DOMAIN --id.secret $PEER_PASSWORD --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://$CA_ADDRESS_PORT

docker exec ca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name User@peer0.$COMPANY_DOMAIN --id.secret userpw --id.type user -u https://$CA_ADDRESS_PORT

# Enroll peer idenities to get certificates
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://peer0.$COMPANY_DOMAIN:peerpw@$CA_ADDRESS_PORT --csr.hosts peer0.$COMPANY_DOMAIN -M $NODE_DIRECTORY/$PEER_DIRECTORY/peers/peer0.$COMPANY_DOMAIN/msp

# Enroll peer identity to get TLS certificates
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://peer0.$COMPANY_DOMAIN:peerpw@$CA_ADDRESS_PORT --csr.hosts peer0.$COMPANY_DOMAIN --enrollment.profile tls -M $NODE_DIRECTORY/$PEER_DIRECTORY/peers/peer0.$COMPANY_DOMAIN/tls

# Enroll Admin identities for the Peer MSP
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@peer0.$COMPANY_DOMAIN:$PEER_PASSWORD@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$PEER_DIRECTORY/users/Admin@peer0.$COMPANY_DOMAIN/msp

# Get Admin certs
docker exec ca.$COMPANY_DOMAIN fabric-ca-client certificate list --id Admin@peer0.$COMPANY_DOMAIN --store $NODE_DIRECTORY/$PEER_DIRECTORY/users/Admin@peer0.$COMPANY_DOMAIN/msp/admincerts

# Enroll User identity to the peer
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://User@peer0.$COMPANY_DOMAIN:userpw@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$PEER_DIRECTORY/users/User@peer0.$COMPANY_DOMAIN/msp

# Copy Admin Certs to root of peerOrganization/msp
docker exec ca.$COMPANY_DOMAIN mkdir $NODE_DIRECTORY/$PEER_DIRECTORY/msp
docker exec ca.$COMPANY_DOMAIN cp -r $NODE_DIRECTORY/$PEER_DIRECTORY/users/Admin@peer0.$COMPANY_DOMAIN/msp/admincerts $NODE_DIRECTORY/$PEER_DIRECTORY/peers/peer0.$COMPANY_DOMAIN/msp/admincerts

# Get Admin identity TLS certificates
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@peer0.$COMPANY_DOMAIN:$PEER_PASSWORD@$CA_ADDRESS_PORT --enrollment.profile tls -M $NODE_DIRECTORY/$PEER_DIRECTORY/users/Admin@peer0.$COMPANY_DOMAIN/tls



######################################
#               Orderer              #
######################################

# Register orderer identities with the CA
docker exec ca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name orderer.$COMPANY_DOMAIN --id.secret $ORDERER_ADMIN_PASSWORD --id.type orderer -u https://$CA_ADDRESS_PORT

docker exec ca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name Admin@orderer.$COMPANY_DOMAIN --id.secret ordereradminpw --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://$CA_ADDRESS_PORT

# Enroll orderer identity
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer.$COMPANY_DOMAIN:$ORDERER_ADMIN_PASSWORD@$CA_ADDRESS_PORT --csr.hosts orderer.$COMPANY_DOMAIN -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer.$COMPANY_DOMAIN/msp

# Enroll TLS orderer identity
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer.$COMPANY_DOMAIN:$ORDERER_ADMIN_PASSWORD@$CA_ADDRESS_PORT --csr.hosts orderer.$COMPANY_DOMAIN --enrollment.profile tls -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer.$COMPANY_DOMAIN/tls

# Enroll orderer Admin identity
docker exec ca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@orderer.$COMPANY_DOMAIN:ordereradminpw@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer.$COMPANY_DOMAIN/msp

# Get Orderer Admin certs
docker exec ca.$COMPANY_DOMAIN fabric-ca-client certificate list --id Admin@orderer.$COMPANY_DOMAIN --store $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@peer0.$COMPANY_DOMAIN/msp/admincerts

# Copy Admin certs to Peers MSP
docker exec ca.$COMPANY_DOMAIN mkdir $NODE_DIRECTORY/$ORDERER_MSP/msp
docker exec ca.$COMPANY_DOMAIN cp -r $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@peer0.$COMPANY_DOMAIN/msp/admincerts/ $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer.$COMPANY_DOMAIN/msp/admincerts


# Get MSP Files for Orderer
# cacerts --orderer
docker exec ca.$COMPANY_DOMAIN fabric-ca-client getcacert -u https://$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$ORDERER_MSP/msp

# AdminCerts --orderer
docker exec ca.$COMPANY_DOMAIN fabric-ca-client certificate list --id Admin@orderer.$COMPANY_DOMAIN --store $NODE_DIRECTORY/$ORDERER_MSP/msp/admincerts

# tlscacerts --orderer
docker exec ca.$COMPANY_DOMAIN fabric-ca-client getcacert -u https://$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$ORDERER_MSP/msp --enrollment.profile tls

# Get MSP Files for Peer
# cacerts --peer org
docker exec ca.$COMPANY_DOMAIN fabric-ca-client getcainfo -u https://$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$PEER_DIRECTORY/msp

# AdminCerts --peer org
docker exec ca.$COMPANY_DOMAIN fabric-ca-client certificate list --id Admin@peer0.$COMPANY_DOMAIN --store $NODE_DIRECTORY/$PEER_DIRECTORY/msp/admincerts

# tlscacerts --peer org
docker exec ca.$COMPANY_DOMAIN fabric-ca-client getcacert -u https://$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$PEER_DIRECTORY/msp --enrollment.profile tls

