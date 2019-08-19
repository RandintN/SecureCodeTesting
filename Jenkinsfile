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
               if [ ! -z $container ]; then
                  docker rm -f $(docker ps -aq)
               fi
            '''
         }
      }
      stage('Docker: Hyperledger'){
         steps {
            script {
               sh ''' 
                  cd $WORKSPACE/hyperledger/environments/dev/
                  ./init_hyperledger.sh
               '''
            }
         }
      } 
   }
}	
