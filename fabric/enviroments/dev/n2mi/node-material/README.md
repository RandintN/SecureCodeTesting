## Rede básicoa para Desenvolvimento

Rede com configuração básica para executar Chaincodes em desenvolvimento.

O canal criado chama-se n2medchannel

Lista de MSP criados:

    - N2miMSP

Para iniciar a rede, certifique-se que o ambiente para o Hyperledger-Fabric está devidamente configurado.

Para configurar o ambiente para o HF, siga as seguintes instruções:

Pre-requisitos:
https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html

Instalar binários:

https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html

Com a configuração do ambiente feita, deve-se gerar o material criptográfico, isso pode ser feito executando o seguinte comando:
``generate.sh``.

Com isso feito, colocar o nome do arquivo gerado ``./crypto-config/peerOrganizations/n2mi.n2med.com/ca/identifier-sample_sk`` deve-se alterar o arquivo ``docker-compose.yml`` no campo ``FABRIC_CA_SERVER_CA_KEYFILE`` do serviço ``ca.n2med.com``. Exemplo:

To start the network, run ``start.sh``.
To stop it, run ``stop.sh``
To completely remove all incriminating evidence of the network
on your system, run ``teardown.sh``.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>
