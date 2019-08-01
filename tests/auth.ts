import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server.js';

// Configure chai
chai.use(chaiHttp);
chai.should();
describe("User", () => {
  describe("Sign up", () => {
    it("Should return the basic information of the user", (done) => {
      chai.request(app)
        .post('/users/signup')
        .type('json')
        .send({
          'first_name': 'Hector',
          'last_name': 'Acosta',
          'email': 'hector@test.com',
          'password': '123456789'
        })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        })
    });
  });
});