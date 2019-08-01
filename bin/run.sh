# run.sh
#!/bin/sh

prisma deploy;
node server.js;