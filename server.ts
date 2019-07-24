
import express = require('express');
import dotenv = require('dotenv');
import bodyParser = require("body-parser");

dotenv.config();

const app: express.Application = express();
const port: string = process.env.PORT || '3000';

const usersRouter = require('./api/routers/users')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/users', usersRouter);

app.listen(port, function () {
  console.log(`App listening on port: ${port}`);
});
