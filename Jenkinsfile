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
      stage('Label: Baseline') {
         steps {
            script {
               if("${TAG_NAME}" == ""){
                  echo "Sem necessidade de label, apenas build"
               }
               else{
                  dir('hyperledger'){
                     echo "Tagging ${TAG_NAME} on Bitbucket"
                     withCredentials([usernamePassword(credentialsId: '6bfbe257-3c46-44be-a2b6-28be60d5a1b9',  passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                               sh 'git tag -a ${TAG_NAME} -m "[${JIRA}] - Cria tag ${TAG_NAME}"'
                               sh 'git push https://${GIT_USERNAME}:${GIT_PASSWORD}@bitbucket.cpqd.com.br/scm/n2mi/core-hyperledger ${TAG_NAME}'
                     }
                  }
               }
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
