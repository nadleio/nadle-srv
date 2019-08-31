import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';

// Configure chai
chai.use(chaiHttp);
chai.should();
