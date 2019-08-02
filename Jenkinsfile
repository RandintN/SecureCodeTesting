pipeline {
   agent { label 'preempdsda01' }
   stages {
      stage ('Clean : WORKSPACE') {
         steps {
            deleteDir()
         }		
      }
      stage('Checkout: Hyperledger') {
         steps {
            dir('hyperledger'){
               git branch: "master",
               credentialsId: '6bfbe257-3c46-44be-a2b6-28be60d5a1b9',
               url: 'https://bitbucket.cpqd.com.br/scm/n2mi/core-hyperledger'
            }
         }
      }
      stage('Remove Containers'){
         steps {
            sh '''
               cd $WORKSPACE/hyperledger/environments/dev
               docker-compose -p n2mi down --remove-orphans
               docker volume prune -f
               docker network prune -f
               container=`docker container ls | awk 'FNR==2{print $0}'`
               if test -z "$container"; then
                  docker rm -f $(docker ps -aq)
               fi
            '''
         }
      }
      stage('Docker: Hyperledger'){
         steps {
            script {
               sh ''' 
                  cd $WORKSPACE/environments/dev/
                  echo -e "\nStarting Core Hyperledger\n"
                  echo -e "\nCreating network n2mi_n2med ..."
                  docker network create n2mi_n2med
                  docker-compose -p n2mi up --build -d
                  sleep 10
                  docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
                  peer channel create -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/channel.tx
                  echo -e "\n Join peer0.org1.example.com to the channel.\n"
                  docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
                  peer channel join -b n2medchannel.block
                  sleep 10
                  docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@n2mi.n2med.com/msp" peer0.n2mi.n2med.com \
                  peer channel update -o orderer.n2med.com:7050 -c n2medchannel -f /etc/hyperledger/configtx/N2miMSPanchors.tx
                  pushd ../../fabric/chaincodes/med
                  npm install
                  npm run build
                  popd

                  docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
                  "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
                  cli peer chaincode install -n med -v 600.50 -p /opt/gopath/src/github.com/med/ -l node

                  docker exec -e "CORE_PEER_LOCALMSPID=N2miMSP" -e \
                  "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/n2mi.n2med.com/users/Admin@n2mi.n2med.com/msp" \
                  cli peer chaincode instantiate -o orderer.n2med.com:7050 -C n2medchannel -n med -l node -v 600.50 -c '{"Args":[]}' -P "OR('N2miMSP.member')" \
                  --collections-config /opt/gopath/src/github.com/med/collection-config.json
               '''
            }
         }
      } 
   }
}	
