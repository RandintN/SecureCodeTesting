#!/bin/bash

usage() { echo "Usage: $0
-o <Organization>
-i <IP Orderer>
-h help"
 exit 1;
}

while getopts "o:i:" OPT; do
    case "${OPT}" in
        o)
            org=${OPTARG}
            ;;
	i)
            ip_orderer=${OPTARG}
	    ;;
        h)
            usage
            ;;
        *)
            usage
            ;;
    esac
done

shift $((OPTIND-1))

if [ -z "${org}" ] || [ -z "${ip_orderer}" ] ; then
    usage
fi

name_channel="n2medchannel"

if [ -d "org_$org" ]; then
	rm -rf org_$org
fi
if [ ! -d "org_$org" ]; then
	mkdir -p org_$org/certificates/config
fi

sed "s/{organization}/$org/g" configtx.yaml.template > org_$org/configtx.yaml
sed "s/{organization}/$org/g" crypto-config.yaml.template > org_$org/crypto-config.yaml

cd org_$org

# Generate crypto material of the organization
cryptogen generate --config=./crypto-config.yaml 

# Generate channel configs
configtxgen -printOrg $org"MSP" > ./certificates/config/org_$org.json

mv crypto-config certificates/crypto-config

#ocker-compose -f docker-compose-hyperledger.yml up -d

# Buscar o bloco 0 no canal e salvar no <name_channel>.block
#docker exec cli.org.com peer channel fetch 0 $name_channel.block -o $ip_orderer:7050 -c $name_channel

# Sincronização dos blocos da rede, a partir do bloco que estou enviando
#docker exec cli.alphamed.com peer channel join -b $name_channel.block

echo "-------------------------------"
echo "Organizacao criada com sucesso!!!"
echo "Favor encaminhar o arquivo org_$org/certificates/config/org_$org.json para o administrador da rede blockchain"
