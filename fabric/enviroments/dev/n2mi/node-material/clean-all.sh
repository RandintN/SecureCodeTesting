docker rm -f $(docker ps -aq) && docker volume prune && docker network prune && docker rmi -f $(docker images dev-* -q)
