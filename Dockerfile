FROM node:10.14.1
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
RUN npm install -g typescript
RUN npm install -g prisma
COPY . .
EXPOSE 3000
EXPOSE 4000
RUN prisma generate
RUN tsc
CMD ./bin/run.sh