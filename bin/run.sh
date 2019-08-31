# run.sh
#!/bin/sh

prisma generate;
prisma deploy;
node server.js;