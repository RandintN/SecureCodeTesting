CA_ADDRESS_PORT=$1
COMPANY_DOMAIN=$2

NODE_DIRECTORY=/etc/hyperledger/fabric-ca-client
ORDERER_MSP=crypto-config/ordererOrganizations
PEER_DIRECTORY=crypto-config/peerOrganizations

docker exec rca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name orderer2.$COMPANY_DOMAIN --id.secret orderer2pw --id.type orderer -u https://$CA_ADDRESS_PORT

docker exec rca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name orderer3.$COMPANY_DOMAIN --id.secret orderer3pw --id.type orderer -u https://$CA_ADDRESS_PORT

docker exec rca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name Admin@orderer2.$COMPANY_DOMAIN --id.secret orderer2adminpw --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://$CA_ADDRESS_PORT

docker exec rca.$COMPANY_DOMAIN fabric-ca-client register -d --id.name Admin@orderer3.$COMPANY_DOMAIN --id.secret orderer3adminpw --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://$CA_ADDRESS_PORT

# Enroll orderer 2 identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer2.$COMPANY_DOMAIN:orderer2pw@$CA_ADDRESS_PORT --csr.hosts orderer2.$COMPANY_DOMAIN -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer2.$COMPANY_DOMAIN/msp

# Enroll TLS orderer 2 identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer2.$COMPANY_DOMAIN:orderer2pw@$CA_ADDRESS_PORT --enrollment.profile tls --csr.hosts orderer2.$COMPANY_DOMAIN,10.202.23.201 -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer2.$COMPANY_DOMAIN/tls

# Enroll orderer 3 identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer3.$COMPANY_DOMAIN:orderer3pw@$CA_ADDRESS_PORT --csr.hosts orderer3.$COMPANY_DOMAIN -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer3.$COMPANY_DOMAIN/msp

# Enroll TLS orderer 3 identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://orderer3.$COMPANY_DOMAIN:orderer3pw@$CA_ADDRESS_PORT --enrollment.profile tls --csr.hosts orderer3.$COMPANY_DOMAIN,10.202.23.202 -M $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer3.$COMPANY_DOMAIN/tls

# Enroll orderer 2 Admin identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@orderer2.$COMPANY_DOMAIN:orderer2adminpw@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer2.$COMPANY_DOMAIN/msp

# Get TLS for 2 Admin identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@orderer2.$COMPANY_DOMAIN:orderer2adminpw@$CA_ADDRESS_PORT --enrollment.profile tls --csr.hosts orderer2.$COMPANY_DOMAIN,10.202.23.201 -M $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer2.$COMPANY_DOMAIN/tls 

# Enroll orderer 3 Admin identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@orderer3.$COMPANY_DOMAIN:orderer3adminpw@$CA_ADDRESS_PORT -M $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer3.$COMPANY_DOMAIN/msp

# Get TLS for 3 Admin identity
docker exec rca.$COMPANY_DOMAIN fabric-ca-client enroll -d -u https://Admin@orderer3.$COMPANY_DOMAIN:orderer3adminpw@$CA_ADDRESS_PORT --enrollment.profile tls --csr.hosts orderer3.$COMPANY_DOMAIN,10.202.23.202 -M $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer3.$COMPANY_DOMAIN/tls 

docker exec rca.$COMPANY_DOMAIN cp -r $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer.$COMPANY_DOMAIN/msp/admincerts/ $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer2.$COMPANY_DOMAIN/msp/admincerts

docker exec rca.$COMPANY_DOMAIN cp -r $NODE_DIRECTORY/$ORDERER_MSP/users/Admin@orderer.$COMPANY_DOMAIN/msp/admincerts/ $NODE_DIRECTORY/$ORDERER_MSP/orderers/orderer3.$COMPANY_DOMAIN/msp/admincerts