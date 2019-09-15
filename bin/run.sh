# run.sh
#!/bin/sh

prisma deploy --force;
node server.js;