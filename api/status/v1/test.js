// Import the dependencies for testing
const chai = require("chai");

const chaiHttp = require("chai-http");
const app = require("../../../server_test");

// Configure chai
chai.use(chaiHttp);
chai.use(require("chai-uuid"));
chai.should();

describe("Status", () => {
  it("should get app status", function(done) {
    chai
      .request(app)
      .get("/status")
      .end(function(err, res) {
        res.should.have.status(200);
        res.body.should.be.a("object");
        done();
      });
  });
});
