# deploy.sh
#!/bin/sh

HEX="$(openssl rand -hex 3)"

docker build . -t nadle/nadle-src:$HEX
docker push nadle/nadle-src:$HEX

kubectl set image deployment/nadle-src nadle-src=nadle/nadle-src:$HEX -n nadle
