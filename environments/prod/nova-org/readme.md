New-Org

Change the following environment variables to reflect the new organization:
    - configtx.yaml
        - Orderer Name (Must include MSP Prefix)
        - Organization Name (Must include MSP Prefix)
        - Profile -> OrdererGenesis - Orderer domain
    - start-org.sh
        - Section 1 - The organization details such as name, domain and peer number
        - Section 2 - The Intermediate Certificate Authority credentials for the CA, peers and orderer    identities 
        - Section 3 - The IP addresses of the current machine the organization will be operating from     and N2Meds IP address location of the CA and N2med