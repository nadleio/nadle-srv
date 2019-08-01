# kubernetes.sh
#!/bin/sh

mkdir ${HOME}/.kube
doctl kubernetes cluster kubeconfig save $CLUSTER_NAME
mv /home/travis/snap/doctl/64/.kube/config ${HOME}/.kube/config