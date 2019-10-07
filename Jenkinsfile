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
      stage('Docker: Hyperledger'){
         steps {
            script {
               sh ''' 
                  cd $WORKSPACE/hyperledger/environments/dev/
                  ./init_hyperledger.sh -o create
               '''
            }
         }
      } 
   }
}	
