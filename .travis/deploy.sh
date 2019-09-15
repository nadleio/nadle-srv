# deploy.sh
#!/bin/sh

HEX="$(openssl rand -hex 3)"

docker build . -t nadle/nadle-src:$HEX
docker push nadle/nadle-src:$HEX
