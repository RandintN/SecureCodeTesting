
# Rede básica para Desenvolvimento
Rede com configuração básica para executar Chaincodes em desenvolvimento.

## Dados da rede
O canal criado chama-se n2medchannel

Lista de MSP criados:

- N2miMSP

## Configurando o ambiente
Para configurar o ambiente para o HF, siga as seguintes instruções:

**Instalar e configurar o Go:**
https://medium.com/@RidhamTarpara/install-go-1-11-on-ubuntu-18-04-16-04-lts-8c098c503c5f

**Pre-requisitos:**
https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html

**Instalar binários:**
Executar o procedimento abaixo no diretório ``.../core-hyperledger/fabric/enviroments/dev/n2mi/node-material`` para instalação das imagens
https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html

Com isso feito, copiar o diretório ``.../core-hyperledger/fabric/enviroments/dev/n2mi/node-material/fabric-samples/bin`` para o diretório ``.../core-hyperledger/fabric/enviroments/dev/n2mi``
 
## Iniciando a rede DLT
Com a configuração do ambiente feita, deve-se gerar o material criptográfico, isso pode ser feito indo até o diretório
``.../core-hyperledger/fabric/enviroments/dev/n2mi/node-material`` e executando o seguinte comando:

``./generate.sh``.

Com isso feito, copie o nome do arquivo gerado:
 ``.../core-hyperledger/fabric/enviroments/dev/n2mi/node-material/crypto-config/peerOrganizations/n2mi.n2med.com/ca/identifier-sample_sk`` 

E cole-o no campo ``FABRIC_CA_SERVER_CA_KEYFILE`` do serviço ``ca.n2med.com`` do arquivo ``docker-compose.yml``, localizado no diretório ``.../core-hyperledger/fabric/enviroments/dev/n2mi/node-material``. 

Exemplo:

Para iniciar a rede DLT execute ``start.sh``.

Para remover completamente os componentes da rede do seu sistema, execute ``clean-all.sh``.